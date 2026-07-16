import 'package:flutter_mobile/features/papers/data/papers_models.dart';
import 'package:flutter_mobile/features/papers/domain/submit_paper_validation.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('SubmitPaperValidation', () {
    test('accepts a valid direct paper submission', () {
      final result = validateSubmitPaper(
        title: 'Large Language Models for Research Education',
        doi: '10.1234/example.paper',
        paperLink: 'https://example.com/paper',
        abstractText: List.filled(60, 'research').join(' '),
        publicationYear: DateTime.now().year.toString(),
        authors: 'Alice Nguyen, Bob Tran',
        keywords: 'LLM, RAG',
      );

      expect(result, isNull);
    });

    test('rejects invalid DOI before a network request is made', () {
      final result = validateSubmitPaper(
        title: 'Large Language Models for Research Education',
        doi: 'bad-doi',
        paperLink: 'https://example.com/paper',
        abstractText: List.filled(60, 'research').join(' '),
        publicationYear: DateTime.now().year.toString(),
        authors: 'Alice Nguyen',
        keywords: 'LLM',
      );

      expect(result, 'Please enter a valid DOI.');
    });

    test('builds a resubmission draft from a rejected paper', () {
      final draft = SubmitPaperDraft.fromPaper(
        const Paper(
          id: 'paper-1',
          title: 'Large Language Models for Research Education',
          publicationYear: 2026,
          citationCount: 4,
          dataStatus: 'active',
          dataQualityScore: 0.85,
          isAiAnalyzable: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          abstractText: 'A clear abstract.',
          authors: [
            PaperAuthorRef(displayName: 'Alice Nguyen', position: 1),
            PaperAuthorRef(displayName: 'Bob Tran', position: 2),
          ],
          keywords: [
            PaperKeyword(keywordName: 'LLM'),
            PaperKeyword(keywordName: 'RAG'),
          ],
          topics: [
            PaperTopic(topicName: 'Education'),
          ],
          paperKind: 'review',
          paperLink: 'https://example.com/paper',
          openAccessUrl: 'https://example.com/pdf',
          paperStatus: 'rejected',
        ),
      );

      expect(canResubmitPaperStatus('rejected'), isTrue);
      expect(canResubmitPaperStatus('pending'), isFalse);
      expect(draft.authorsCsv, 'Alice Nguyen, Bob Tran');
      expect(draft.keywordsCsv, 'LLM, RAG');
      expect(draft.topicsCsv, 'Education');
      expect(draft.paperKind, 'review');
    });
  });
}
