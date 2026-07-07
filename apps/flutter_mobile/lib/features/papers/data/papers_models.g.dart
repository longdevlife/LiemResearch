// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'papers_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_PaperAuthorRef _$PaperAuthorRefFromJson(Map<String, dynamic> json) =>
    _PaperAuthorRef(
      authorId: json['authorId'] as String?,
      displayName: json['displayName'] as String,
      position: (json['position'] as num).toInt(),
      isCorresponding: json['isCorresponding'] as bool?,
    );

Map<String, dynamic> _$PaperAuthorRefToJson(_PaperAuthorRef instance) =>
    <String, dynamic>{
      'authorId': instance.authorId,
      'displayName': instance.displayName,
      'position': instance.position,
      'isCorresponding': instance.isCorresponding,
    };

_PaperKeyword _$PaperKeywordFromJson(Map<String, dynamic> json) =>
    _PaperKeyword(
      keywordId: json['keywordId'] as String?,
      keywordName: json['keywordName'] as String,
      detectedBy: json['detectedBy'] as String?,
      confidence: (json['confidence'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$PaperKeywordToJson(_PaperKeyword instance) =>
    <String, dynamic>{
      'keywordId': instance.keywordId,
      'keywordName': instance.keywordName,
      'detectedBy': instance.detectedBy,
      'confidence': instance.confidence,
    };

_PaperTopic _$PaperTopicFromJson(Map<String, dynamic> json) => _PaperTopic(
  topicId: json['topicId'] as String?,
  topicName: json['topicName'] as String,
  detectedBy: json['detectedBy'] as String?,
  confidence: (json['confidence'] as num?)?.toDouble(),
);

Map<String, dynamic> _$PaperTopicToJson(_PaperTopic instance) =>
    <String, dynamic>{
      'topicId': instance.topicId,
      'topicName': instance.topicName,
      'detectedBy': instance.detectedBy,
      'confidence': instance.confidence,
    };

_Paper _$PaperFromJson(Map<String, dynamic> json) => _Paper(
  id: json['id'] as String,
  title: json['title'] as String,
  abstractText: json['abstractText'] as String?,
  authors:
      (json['authors'] as List<dynamic>?)
          ?.map((e) => PaperAuthorRef.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  journalName: json['journalName'] as String?,
  publicationYear: (json['publicationYear'] as num).toInt(),
  paperKind: json['paperKind'] as String?,
  openAccessStatus: json['openAccessStatus'] as String?,
  openAccessUrl: json['openAccessUrl'] as String?,
  citationCount: (json['citationCount'] as num).toInt(),
  keywords:
      (json['keywords'] as List<dynamic>?)
          ?.map((e) => PaperKeyword.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  topics:
      (json['topics'] as List<dynamic>?)
          ?.map((e) => PaperTopic.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  dataStatus: json['dataStatus'] as String,
  dataQualityScore: (json['dataQualityScore'] as num).toDouble(),
  isAiAnalyzable: json['isAiAnalyzable'] as bool,
  downloadCost: (json['downloadCost'] as num?)?.toDouble(),
  uploadCreditReward: (json['uploadCreditReward'] as num?)?.toDouble(),
  pdfPath: json['pdfPath'] as String?,
  paperLink: json['paperLink'] as String?,
  paperStatus: json['paperStatus'] as String?,
  rejectionReason: json['rejectionReason'] as String?,
  createdAt: json['createdAt'] as String,
  updatedAt: json['updatedAt'] as String,
);

Map<String, dynamic> _$PaperToJson(_Paper instance) => <String, dynamic>{
  'id': instance.id,
  'title': instance.title,
  'abstractText': instance.abstractText,
  'authors': instance.authors,
  'journalName': instance.journalName,
  'publicationYear': instance.publicationYear,
  'paperKind': instance.paperKind,
  'openAccessStatus': instance.openAccessStatus,
  'openAccessUrl': instance.openAccessUrl,
  'citationCount': instance.citationCount,
  'keywords': instance.keywords,
  'topics': instance.topics,
  'dataStatus': instance.dataStatus,
  'dataQualityScore': instance.dataQualityScore,
  'isAiAnalyzable': instance.isAiAnalyzable,
  'downloadCost': instance.downloadCost,
  'uploadCreditReward': instance.uploadCreditReward,
  'pdfPath': instance.pdfPath,
  'paperLink': instance.paperLink,
  'paperStatus': instance.paperStatus,
  'rejectionReason': instance.rejectionReason,
  'createdAt': instance.createdAt,
  'updatedAt': instance.updatedAt,
};
