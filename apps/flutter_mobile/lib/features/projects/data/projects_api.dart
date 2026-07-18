import 'package:dio/dio.dart';
import 'package:flutter_mobile/core/constants/api_routes.dart';
import 'package:flutter_mobile/core/network/api_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';

final projectsApiProvider = Provider<ProjectsApi>((ref) {
  return ProjectsApi(ref.watch(apiClientProvider).dio);
});

final FutureProvider<List<ProjectView>> projectsProvider = FutureProvider.autoDispose<List<ProjectView>>((ref) {
  return ref.watch(projectsApiProvider).list();
});

final FutureProviderFamily<ProjectView, String> projectProvider = FutureProvider.autoDispose.family<ProjectView, String>((ref, id) {
  return ref.watch(projectsApiProvider).detail(id);
});

final FutureProviderFamily<List<ProjectChatMessage>, String> projectChatProvider = FutureProvider.autoDispose.family<List<ProjectChatMessage>, String>((ref, id) {
  return ref.watch(projectsApiProvider).listChat(id);
});

class ProjectView {
  const ProjectView({required this.id, required this.title, this.description, this.members = const [], this.papers = const []});

  factory ProjectView.fromJson(Map<String, dynamic> json) {
    return ProjectView(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? 'Untitled project').toString(),
      description: json['description']?.toString(),
      members: json['members'] as List<dynamic>? ?? [],
      papers: json['papers'] as List<dynamic>? ?? [],
    );
  }

  final String id;
  final String title;
  final String? description;
  final List<dynamic> members;
  final List<dynamic> papers;
}

class ProjectChatMessage {
  const ProjectChatMessage({required this.id, required this.role, required this.content, required this.createdAt});

  factory ProjectChatMessage.fromJson(Map<String, dynamic> json) {
    return ProjectChatMessage(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      role: (json['role'] ?? 'assistant').toString(),
      content: (json['content'] ?? '').toString(),
      createdAt: (json['createdAt'] ?? '').toString(),
    );
  }

  final String id;
  final String role;
  final String content;
  final String createdAt;
}

class ProjectsApi {
  const ProjectsApi(this._dio);

  final Dio _dio;

  Future<List<ProjectView>> list() async {
    final res = await _dio.get<Map<String, dynamic>>(ApiRoutes.projectsList);
    return (res.data?['data'] as List<dynamic>? ?? [])
        .whereType<Map<String, dynamic>>()
        .map(ProjectView.fromJson)
        .toList();
  }

  Future<ProjectView> detail(String id) async {
    final res = await _dio.get<Map<String, dynamic>>(ApiRoutes.projectsDetail(id));
    return ProjectView.fromJson((res.data?['data'] as Map<String, dynamic>?) ?? {});
  }

  Future<ProjectView> create(String title, String? description) async {
    final res = await _dio.post<Map<String, dynamic>>(ApiRoutes.projectsCreate, data: {'title': title, if (description != null && description.isNotEmpty) 'description': description});
    return ProjectView.fromJson((res.data?['data'] as Map<String, dynamic>?) ?? {});
  }

  Future<void> addPaper(String projectId, String paperId) => _dio.post<void>(ApiRoutes.projectsAddPaper(projectId), data: {'paperId': paperId});

  Future<List<ProjectChatMessage>> listChat(String projectId) async {
    final res = await _dio.get<Map<String, dynamic>>(ApiRoutes.projectsChatHistory(projectId), queryParameters: {'limit': 50});
    final data = res.data?['data'] as Map<String, dynamic>? ?? {};
    return (data['messages'] as List<dynamic>? ?? [])
        .whereType<Map<String, dynamic>>()
        .map(ProjectChatMessage.fromJson)
        .toList();
  }

  Future<void> sendChat(String projectId, String message) => _dio.post<void>(ApiRoutes.projectsChatSend(projectId), data: {'message': message});
}
