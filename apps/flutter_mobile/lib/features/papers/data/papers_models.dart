import 'package:freezed_annotation/freezed_annotation.dart';

part 'papers_models.freezed.dart';
part 'papers_models.g.dart';

@freezed
abstract class PaperAuthorRef with _$PaperAuthorRef {
  const factory PaperAuthorRef({
    required String displayName, required int position, String? authorId,
    bool? isCorresponding,
  }) = _PaperAuthorRef;

  factory PaperAuthorRef.fromJson(Map<String, dynamic> json) => _$PaperAuthorRefFromJson(json);
}

@freezed
abstract class PaperKeyword with _$PaperKeyword {
  const factory PaperKeyword({
    required String keywordName, String? keywordId,
    String? detectedBy,
    double? confidence,
  }) = _PaperKeyword;

  factory PaperKeyword.fromJson(Map<String, dynamic> json) => _$PaperKeywordFromJson(json);
}

@freezed
abstract class PaperTopic with _$PaperTopic {
  const factory PaperTopic({
    required String topicName, String? topicId,
    String? detectedBy,
    double? confidence,
  }) = _PaperTopic;

  factory PaperTopic.fromJson(Map<String, dynamic> json) => _$PaperTopicFromJson(json);
}

@freezed
abstract class Paper with _$Paper {
  const factory Paper({
    required String id,
    required String title,
    required int publicationYear, required int citationCount, required String dataStatus, required double dataQualityScore, required bool isAiAnalyzable, required String createdAt, required String updatedAt, String? abstractText,
    @Default([]) List<PaperAuthorRef> authors,
    String? journalName,
    String? paperKind,
    String? openAccessStatus,
    String? openAccessUrl,
    @Default([]) List<PaperKeyword> keywords,
    @Default([]) List<PaperTopic> topics,
    double? downloadCost,
    double? uploadCreditReward,
    String? pdfPath,
    String? paperLink,
    String? paperStatus,
    String? rejectionReason,
  }) = _Paper;

  factory Paper.fromJson(Map<String, dynamic> json) => _$PaperFromJson(json);
}
