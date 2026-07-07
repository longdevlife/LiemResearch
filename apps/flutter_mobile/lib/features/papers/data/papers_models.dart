import 'package:freezed_annotation/freezed_annotation.dart';

part 'papers_models.freezed.dart';
part 'papers_models.g.dart';

@freezed
class PaperAuthorRef with _$PaperAuthorRef {
  const factory PaperAuthorRef({
    String? authorId,
    required String displayName,
    required int position,
    bool? isCorresponding,
  }) = _PaperAuthorRef;

  factory PaperAuthorRef.fromJson(Map<String, dynamic> json) => _$PaperAuthorRefFromJson(json);
}

@freezed
class PaperKeyword with _$PaperKeyword {
  const factory PaperKeyword({
    String? keywordId,
    required String keywordName,
    String? detectedBy,
    double? confidence,
  }) = _PaperKeyword;

  factory PaperKeyword.fromJson(Map<String, dynamic> json) => _$PaperKeywordFromJson(json);
}

@freezed
class PaperTopic with _$PaperTopic {
  const factory PaperTopic({
    String? topicId,
    required String topicName,
    String? detectedBy,
    double? confidence,
  }) = _PaperTopic;

  factory PaperTopic.fromJson(Map<String, dynamic> json) => _$PaperTopicFromJson(json);
}

@freezed
class Paper with _$Paper {
  const factory Paper({
    required String id,
    required String title,
    String? abstractText,
    @Default([]) List<PaperAuthorRef> authors,
    String? journalName,
    required int publicationYear,
    String? paperKind,
    String? openAccessStatus,
    String? openAccessUrl,
    required int citationCount,
    @Default([]) List<PaperKeyword> keywords,
    @Default([]) List<PaperTopic> topics,
    required String dataStatus,
    required double dataQualityScore,
    required bool isAiAnalyzable,
    double? downloadCost,
    double? uploadCreditReward,
    String? pdfPath,
    String? paperLink,
    String? paperStatus,
    String? rejectionReason,
    required String createdAt,
    required String updatedAt,
  }) = _Paper;

  factory Paper.fromJson(Map<String, dynamic> json) => _$PaperFromJson(json);
}
