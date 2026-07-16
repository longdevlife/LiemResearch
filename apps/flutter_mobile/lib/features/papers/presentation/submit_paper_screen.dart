import 'dart:async';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_mobile/features/papers/data/papers_api.dart';
import 'package:flutter_mobile/features/papers/domain/submit_paper_validation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class SubmitPaperScreen extends ConsumerStatefulWidget {
  const SubmitPaperScreen({super.key, this.editId});

  final String? editId;

  @override
  ConsumerState<SubmitPaperScreen> createState() => _SubmitPaperScreenState();
}

class _SubmitPaperScreenState extends ConsumerState<SubmitPaperScreen> {
  final title = TextEditingController();
  final doi = TextEditingController();
  final paperLink = TextEditingController();
  final abstractText = TextEditingController();
  final year = TextEditingController(text: DateTime.now().year.toString());
  final authors = TextEditingController();
  final keywords = TextEditingController();
  final topics = TextEditingController();
  final openAccessUrl = TextEditingController();
  String paperKind = 'article';
  PaperSubmitFile? pdf;
  bool submitting = false;
  bool loadingEdit = false;
  bool editDraftLoaded = false;

  @override
  void initState() {
    super.initState();
    if (widget.editId != null) {
      unawaited(_loadEditDraft());
    }
  }

  @override
  void dispose() {
    for (final controller in [title, doi, paperLink, abstractText, year, authors, keywords, topics, openAccessUrl]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _pickPdf() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['pdf']);
    final file = result?.files.single;
    if (file == null || file.path == null) return;
    if ((file.size) > 10 * 1024 * 1024) {
      _show('PDF must be 10MB or smaller.');
      return;
    }
    setState(() => pdf = PaperSubmitFile(path: file.path!, name: file.name, mimeType: 'application/pdf'));
  }

  Future<void> _loadEditDraft() async {
    setState(() => loadingEdit = true);
    try {
      final paper = await ref.read(papersApiProvider).detail(widget.editId!);
      final draft = SubmitPaperDraft.fromPaper(paper);
      if (!mounted) return;
      setState(() {
        title.text = draft.title;
        doi.text = draft.doi;
        paperLink.text = draft.paperLink;
        abstractText.text = draft.abstractText;
        year.text = draft.publicationYear;
        paperKind = draft.paperKind;
        authors.text = draft.authorsCsv;
        keywords.text = draft.keywordsCsv;
        topics.text = draft.topicsCsv;
        openAccessUrl.text = draft.openAccessUrl;
        editDraftLoaded = true;
      });
    } on Object catch (e) {
      if (mounted) _show(e.toString());
    } finally {
      if (mounted) setState(() => loadingEdit = false);
    }
  }

  Future<void> _submit() async {
    final error = validateSubmitPaper(
      title: title.text,
      doi: doi.text,
      paperLink: paperLink.text,
      abstractText: abstractText.text,
      publicationYear: year.text,
      authors: authors.text,
      keywords: keywords.text,
    );
    if (error != null) {
      _show(error);
      return;
    }
    setState(() => submitting = true);
    final input = SubmitPaperInput(
      title: title.text,
      doi: doi.text,
      paperLink: paperLink.text,
      abstractText: abstractText.text,
      publicationYear: int.parse(year.text),
      paperKind: paperKind,
      authors: csvList(authors.text),
      keywords: csvList(keywords.text),
      topics: csvList(topics.text),
      openAccessUrl: openAccessUrl.text,
      pdf: pdf,
    );
    try {
      if (widget.editId == null) {
        await ref.read(papersApiProvider).create(input);
      } else {
        await ref.read(papersApiProvider).update(widget.editId!, input);
      }
      ref.invalidate(myPapersProvider);
      if (mounted) context.go('/my-papers');
    } on Object catch (e) {
      _show(e.toString());
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }

  void _show(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final kinds = ['article', 'proceedings', 'preprint', 'review', 'book-chapter', 'other'];
    return Scaffold(
      appBar: AppBar(title: Text(widget.editId == null ? 'Submit Paper' : 'Resubmit Paper')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (loadingEdit && !editDraftLoaded)
            const LinearProgressIndicator(),
          Card(
            child: ListTile(
              leading: const Icon(Icons.info_outline),
              title: Text(widget.editId == null ? 'Direct submission' : 'Fix and resubmit'),
              subtitle: const Text('New submissions cost credits and stay pending until admin review.'),
            ),
          ),
          _Field(label: 'Title', controller: title),
          _Field(label: 'DOI', controller: doi),
          _Field(label: 'Paper link', controller: paperLink),
          _Field(label: 'Abstract (${countWords(abstractText.text)}/350 words)', controller: abstractText, maxLines: 5, onChanged: (_) => setState(() {})),
          _Field(label: 'Publication year', controller: year, keyboardType: TextInputType.number),
          Wrap(
            spacing: 8,
            children: kinds.map((kind) => ChoiceChip(label: Text(kind), selected: paperKind == kind, onSelected: (_) => setState(() => paperKind = kind))).toList(),
          ),
          const SizedBox(height: 12),
          _Field(label: 'Authors', controller: authors),
          _Field(label: 'Keywords', controller: keywords),
          _Field(label: 'Topics', controller: topics),
          _Field(label: 'Open access URL', controller: openAccessUrl),
          OutlinedButton.icon(onPressed: _pickPdf, icon: const Icon(Icons.picture_as_pdf), label: Text(pdf?.name ?? 'Choose PDF')),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: submitting ? null : _submit,
            child: submitting ? const CircularProgressIndicator() : Text(widget.editId == null ? 'Submit paper' : 'Resubmit paper'),
          ),
        ],
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({required this.label, required this.controller, this.maxLines = 1, this.keyboardType, this.onChanged});

  final String label;
  final TextEditingController controller;
  final int maxLines;
  final TextInputType? keyboardType;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        keyboardType: keyboardType,
        onChanged: onChanged,
        decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
      ),
    );
  }
}
