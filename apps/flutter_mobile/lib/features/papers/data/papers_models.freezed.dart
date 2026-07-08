// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'papers_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$PaperAuthorRef {

 String get displayName; int get position; String? get authorId; bool? get isCorresponding;
/// Create a copy of PaperAuthorRef
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PaperAuthorRefCopyWith<PaperAuthorRef> get copyWith => _$PaperAuthorRefCopyWithImpl<PaperAuthorRef>(this as PaperAuthorRef, _$identity);

  /// Serializes this PaperAuthorRef to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PaperAuthorRef&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.position, position) || other.position == position)&&(identical(other.authorId, authorId) || other.authorId == authorId)&&(identical(other.isCorresponding, isCorresponding) || other.isCorresponding == isCorresponding));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,displayName,position,authorId,isCorresponding);

@override
String toString() {
  return 'PaperAuthorRef(displayName: $displayName, position: $position, authorId: $authorId, isCorresponding: $isCorresponding)';
}


}

/// @nodoc
abstract mixin class $PaperAuthorRefCopyWith<$Res>  {
  factory $PaperAuthorRefCopyWith(PaperAuthorRef value, $Res Function(PaperAuthorRef) _then) = _$PaperAuthorRefCopyWithImpl;
@useResult
$Res call({
 String displayName, int position, String? authorId, bool? isCorresponding
});




}
/// @nodoc
class _$PaperAuthorRefCopyWithImpl<$Res>
    implements $PaperAuthorRefCopyWith<$Res> {
  _$PaperAuthorRefCopyWithImpl(this._self, this._then);

  final PaperAuthorRef _self;
  final $Res Function(PaperAuthorRef) _then;

/// Create a copy of PaperAuthorRef
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? displayName = null,Object? position = null,Object? authorId = freezed,Object? isCorresponding = freezed,}) {
  return _then(_self.copyWith(
displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,position: null == position ? _self.position : position // ignore: cast_nullable_to_non_nullable
as int,authorId: freezed == authorId ? _self.authorId : authorId // ignore: cast_nullable_to_non_nullable
as String?,isCorresponding: freezed == isCorresponding ? _self.isCorresponding : isCorresponding // ignore: cast_nullable_to_non_nullable
as bool?,
  ));
}

}


/// Adds pattern-matching-related methods to [PaperAuthorRef].
extension PaperAuthorRefPatterns on PaperAuthorRef {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PaperAuthorRef value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PaperAuthorRef() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PaperAuthorRef value)  $default,){
final _that = this;
switch (_that) {
case _PaperAuthorRef():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PaperAuthorRef value)?  $default,){
final _that = this;
switch (_that) {
case _PaperAuthorRef() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String displayName,  int position,  String? authorId,  bool? isCorresponding)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PaperAuthorRef() when $default != null:
return $default(_that.displayName,_that.position,_that.authorId,_that.isCorresponding);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String displayName,  int position,  String? authorId,  bool? isCorresponding)  $default,) {final _that = this;
switch (_that) {
case _PaperAuthorRef():
return $default(_that.displayName,_that.position,_that.authorId,_that.isCorresponding);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String displayName,  int position,  String? authorId,  bool? isCorresponding)?  $default,) {final _that = this;
switch (_that) {
case _PaperAuthorRef() when $default != null:
return $default(_that.displayName,_that.position,_that.authorId,_that.isCorresponding);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PaperAuthorRef implements PaperAuthorRef {
  const _PaperAuthorRef({required this.displayName, required this.position, this.authorId, this.isCorresponding});
  factory _PaperAuthorRef.fromJson(Map<String, dynamic> json) => _$PaperAuthorRefFromJson(json);

@override final  String displayName;
@override final  int position;
@override final  String? authorId;
@override final  bool? isCorresponding;

/// Create a copy of PaperAuthorRef
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PaperAuthorRefCopyWith<_PaperAuthorRef> get copyWith => __$PaperAuthorRefCopyWithImpl<_PaperAuthorRef>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PaperAuthorRefToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PaperAuthorRef&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.position, position) || other.position == position)&&(identical(other.authorId, authorId) || other.authorId == authorId)&&(identical(other.isCorresponding, isCorresponding) || other.isCorresponding == isCorresponding));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,displayName,position,authorId,isCorresponding);

@override
String toString() {
  return 'PaperAuthorRef(displayName: $displayName, position: $position, authorId: $authorId, isCorresponding: $isCorresponding)';
}


}

/// @nodoc
abstract mixin class _$PaperAuthorRefCopyWith<$Res> implements $PaperAuthorRefCopyWith<$Res> {
  factory _$PaperAuthorRefCopyWith(_PaperAuthorRef value, $Res Function(_PaperAuthorRef) _then) = __$PaperAuthorRefCopyWithImpl;
@override @useResult
$Res call({
 String displayName, int position, String? authorId, bool? isCorresponding
});




}
/// @nodoc
class __$PaperAuthorRefCopyWithImpl<$Res>
    implements _$PaperAuthorRefCopyWith<$Res> {
  __$PaperAuthorRefCopyWithImpl(this._self, this._then);

  final _PaperAuthorRef _self;
  final $Res Function(_PaperAuthorRef) _then;

/// Create a copy of PaperAuthorRef
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? displayName = null,Object? position = null,Object? authorId = freezed,Object? isCorresponding = freezed,}) {
  return _then(_PaperAuthorRef(
displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,position: null == position ? _self.position : position // ignore: cast_nullable_to_non_nullable
as int,authorId: freezed == authorId ? _self.authorId : authorId // ignore: cast_nullable_to_non_nullable
as String?,isCorresponding: freezed == isCorresponding ? _self.isCorresponding : isCorresponding // ignore: cast_nullable_to_non_nullable
as bool?,
  ));
}


}


/// @nodoc
mixin _$PaperKeyword {

 String get keywordName; String? get keywordId; String? get detectedBy; double? get confidence;
/// Create a copy of PaperKeyword
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PaperKeywordCopyWith<PaperKeyword> get copyWith => _$PaperKeywordCopyWithImpl<PaperKeyword>(this as PaperKeyword, _$identity);

  /// Serializes this PaperKeyword to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PaperKeyword&&(identical(other.keywordName, keywordName) || other.keywordName == keywordName)&&(identical(other.keywordId, keywordId) || other.keywordId == keywordId)&&(identical(other.detectedBy, detectedBy) || other.detectedBy == detectedBy)&&(identical(other.confidence, confidence) || other.confidence == confidence));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,keywordName,keywordId,detectedBy,confidence);

@override
String toString() {
  return 'PaperKeyword(keywordName: $keywordName, keywordId: $keywordId, detectedBy: $detectedBy, confidence: $confidence)';
}


}

/// @nodoc
abstract mixin class $PaperKeywordCopyWith<$Res>  {
  factory $PaperKeywordCopyWith(PaperKeyword value, $Res Function(PaperKeyword) _then) = _$PaperKeywordCopyWithImpl;
@useResult
$Res call({
 String keywordName, String? keywordId, String? detectedBy, double? confidence
});




}
/// @nodoc
class _$PaperKeywordCopyWithImpl<$Res>
    implements $PaperKeywordCopyWith<$Res> {
  _$PaperKeywordCopyWithImpl(this._self, this._then);

  final PaperKeyword _self;
  final $Res Function(PaperKeyword) _then;

/// Create a copy of PaperKeyword
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? keywordName = null,Object? keywordId = freezed,Object? detectedBy = freezed,Object? confidence = freezed,}) {
  return _then(_self.copyWith(
keywordName: null == keywordName ? _self.keywordName : keywordName // ignore: cast_nullable_to_non_nullable
as String,keywordId: freezed == keywordId ? _self.keywordId : keywordId // ignore: cast_nullable_to_non_nullable
as String?,detectedBy: freezed == detectedBy ? _self.detectedBy : detectedBy // ignore: cast_nullable_to_non_nullable
as String?,confidence: freezed == confidence ? _self.confidence : confidence // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}

}


/// Adds pattern-matching-related methods to [PaperKeyword].
extension PaperKeywordPatterns on PaperKeyword {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PaperKeyword value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PaperKeyword() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PaperKeyword value)  $default,){
final _that = this;
switch (_that) {
case _PaperKeyword():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PaperKeyword value)?  $default,){
final _that = this;
switch (_that) {
case _PaperKeyword() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String keywordName,  String? keywordId,  String? detectedBy,  double? confidence)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PaperKeyword() when $default != null:
return $default(_that.keywordName,_that.keywordId,_that.detectedBy,_that.confidence);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String keywordName,  String? keywordId,  String? detectedBy,  double? confidence)  $default,) {final _that = this;
switch (_that) {
case _PaperKeyword():
return $default(_that.keywordName,_that.keywordId,_that.detectedBy,_that.confidence);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String keywordName,  String? keywordId,  String? detectedBy,  double? confidence)?  $default,) {final _that = this;
switch (_that) {
case _PaperKeyword() when $default != null:
return $default(_that.keywordName,_that.keywordId,_that.detectedBy,_that.confidence);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PaperKeyword implements PaperKeyword {
  const _PaperKeyword({required this.keywordName, this.keywordId, this.detectedBy, this.confidence});
  factory _PaperKeyword.fromJson(Map<String, dynamic> json) => _$PaperKeywordFromJson(json);

@override final  String keywordName;
@override final  String? keywordId;
@override final  String? detectedBy;
@override final  double? confidence;

/// Create a copy of PaperKeyword
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PaperKeywordCopyWith<_PaperKeyword> get copyWith => __$PaperKeywordCopyWithImpl<_PaperKeyword>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PaperKeywordToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PaperKeyword&&(identical(other.keywordName, keywordName) || other.keywordName == keywordName)&&(identical(other.keywordId, keywordId) || other.keywordId == keywordId)&&(identical(other.detectedBy, detectedBy) || other.detectedBy == detectedBy)&&(identical(other.confidence, confidence) || other.confidence == confidence));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,keywordName,keywordId,detectedBy,confidence);

@override
String toString() {
  return 'PaperKeyword(keywordName: $keywordName, keywordId: $keywordId, detectedBy: $detectedBy, confidence: $confidence)';
}


}

/// @nodoc
abstract mixin class _$PaperKeywordCopyWith<$Res> implements $PaperKeywordCopyWith<$Res> {
  factory _$PaperKeywordCopyWith(_PaperKeyword value, $Res Function(_PaperKeyword) _then) = __$PaperKeywordCopyWithImpl;
@override @useResult
$Res call({
 String keywordName, String? keywordId, String? detectedBy, double? confidence
});




}
/// @nodoc
class __$PaperKeywordCopyWithImpl<$Res>
    implements _$PaperKeywordCopyWith<$Res> {
  __$PaperKeywordCopyWithImpl(this._self, this._then);

  final _PaperKeyword _self;
  final $Res Function(_PaperKeyword) _then;

/// Create a copy of PaperKeyword
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? keywordName = null,Object? keywordId = freezed,Object? detectedBy = freezed,Object? confidence = freezed,}) {
  return _then(_PaperKeyword(
keywordName: null == keywordName ? _self.keywordName : keywordName // ignore: cast_nullable_to_non_nullable
as String,keywordId: freezed == keywordId ? _self.keywordId : keywordId // ignore: cast_nullable_to_non_nullable
as String?,detectedBy: freezed == detectedBy ? _self.detectedBy : detectedBy // ignore: cast_nullable_to_non_nullable
as String?,confidence: freezed == confidence ? _self.confidence : confidence // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}


}


/// @nodoc
mixin _$PaperTopic {

 String get topicName; String? get topicId; String? get detectedBy; double? get confidence;
/// Create a copy of PaperTopic
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PaperTopicCopyWith<PaperTopic> get copyWith => _$PaperTopicCopyWithImpl<PaperTopic>(this as PaperTopic, _$identity);

  /// Serializes this PaperTopic to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PaperTopic&&(identical(other.topicName, topicName) || other.topicName == topicName)&&(identical(other.topicId, topicId) || other.topicId == topicId)&&(identical(other.detectedBy, detectedBy) || other.detectedBy == detectedBy)&&(identical(other.confidence, confidence) || other.confidence == confidence));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,topicName,topicId,detectedBy,confidence);

@override
String toString() {
  return 'PaperTopic(topicName: $topicName, topicId: $topicId, detectedBy: $detectedBy, confidence: $confidence)';
}


}

/// @nodoc
abstract mixin class $PaperTopicCopyWith<$Res>  {
  factory $PaperTopicCopyWith(PaperTopic value, $Res Function(PaperTopic) _then) = _$PaperTopicCopyWithImpl;
@useResult
$Res call({
 String topicName, String? topicId, String? detectedBy, double? confidence
});




}
/// @nodoc
class _$PaperTopicCopyWithImpl<$Res>
    implements $PaperTopicCopyWith<$Res> {
  _$PaperTopicCopyWithImpl(this._self, this._then);

  final PaperTopic _self;
  final $Res Function(PaperTopic) _then;

/// Create a copy of PaperTopic
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? topicName = null,Object? topicId = freezed,Object? detectedBy = freezed,Object? confidence = freezed,}) {
  return _then(_self.copyWith(
topicName: null == topicName ? _self.topicName : topicName // ignore: cast_nullable_to_non_nullable
as String,topicId: freezed == topicId ? _self.topicId : topicId // ignore: cast_nullable_to_non_nullable
as String?,detectedBy: freezed == detectedBy ? _self.detectedBy : detectedBy // ignore: cast_nullable_to_non_nullable
as String?,confidence: freezed == confidence ? _self.confidence : confidence // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}

}


/// Adds pattern-matching-related methods to [PaperTopic].
extension PaperTopicPatterns on PaperTopic {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PaperTopic value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PaperTopic() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PaperTopic value)  $default,){
final _that = this;
switch (_that) {
case _PaperTopic():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PaperTopic value)?  $default,){
final _that = this;
switch (_that) {
case _PaperTopic() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String topicName,  String? topicId,  String? detectedBy,  double? confidence)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PaperTopic() when $default != null:
return $default(_that.topicName,_that.topicId,_that.detectedBy,_that.confidence);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String topicName,  String? topicId,  String? detectedBy,  double? confidence)  $default,) {final _that = this;
switch (_that) {
case _PaperTopic():
return $default(_that.topicName,_that.topicId,_that.detectedBy,_that.confidence);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String topicName,  String? topicId,  String? detectedBy,  double? confidence)?  $default,) {final _that = this;
switch (_that) {
case _PaperTopic() when $default != null:
return $default(_that.topicName,_that.topicId,_that.detectedBy,_that.confidence);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PaperTopic implements PaperTopic {
  const _PaperTopic({required this.topicName, this.topicId, this.detectedBy, this.confidence});
  factory _PaperTopic.fromJson(Map<String, dynamic> json) => _$PaperTopicFromJson(json);

@override final  String topicName;
@override final  String? topicId;
@override final  String? detectedBy;
@override final  double? confidence;

/// Create a copy of PaperTopic
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PaperTopicCopyWith<_PaperTopic> get copyWith => __$PaperTopicCopyWithImpl<_PaperTopic>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PaperTopicToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PaperTopic&&(identical(other.topicName, topicName) || other.topicName == topicName)&&(identical(other.topicId, topicId) || other.topicId == topicId)&&(identical(other.detectedBy, detectedBy) || other.detectedBy == detectedBy)&&(identical(other.confidence, confidence) || other.confidence == confidence));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,topicName,topicId,detectedBy,confidence);

@override
String toString() {
  return 'PaperTopic(topicName: $topicName, topicId: $topicId, detectedBy: $detectedBy, confidence: $confidence)';
}


}

/// @nodoc
abstract mixin class _$PaperTopicCopyWith<$Res> implements $PaperTopicCopyWith<$Res> {
  factory _$PaperTopicCopyWith(_PaperTopic value, $Res Function(_PaperTopic) _then) = __$PaperTopicCopyWithImpl;
@override @useResult
$Res call({
 String topicName, String? topicId, String? detectedBy, double? confidence
});




}
/// @nodoc
class __$PaperTopicCopyWithImpl<$Res>
    implements _$PaperTopicCopyWith<$Res> {
  __$PaperTopicCopyWithImpl(this._self, this._then);

  final _PaperTopic _self;
  final $Res Function(_PaperTopic) _then;

/// Create a copy of PaperTopic
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? topicName = null,Object? topicId = freezed,Object? detectedBy = freezed,Object? confidence = freezed,}) {
  return _then(_PaperTopic(
topicName: null == topicName ? _self.topicName : topicName // ignore: cast_nullable_to_non_nullable
as String,topicId: freezed == topicId ? _self.topicId : topicId // ignore: cast_nullable_to_non_nullable
as String?,detectedBy: freezed == detectedBy ? _self.detectedBy : detectedBy // ignore: cast_nullable_to_non_nullable
as String?,confidence: freezed == confidence ? _self.confidence : confidence // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}


}


/// @nodoc
mixin _$Paper {

 String get id; String get title; int get publicationYear; int get citationCount; String get dataStatus; double get dataQualityScore; bool get isAiAnalyzable; String get createdAt; String get updatedAt; String? get abstractText; List<PaperAuthorRef> get authors; String? get journalName; String? get paperKind; String? get openAccessStatus; String? get openAccessUrl; List<PaperKeyword> get keywords; List<PaperTopic> get topics; double? get downloadCost; double? get uploadCreditReward; String? get pdfPath; String? get paperLink; String? get paperStatus; String? get rejectionReason;
/// Create a copy of Paper
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PaperCopyWith<Paper> get copyWith => _$PaperCopyWithImpl<Paper>(this as Paper, _$identity);

  /// Serializes this Paper to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Paper&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.publicationYear, publicationYear) || other.publicationYear == publicationYear)&&(identical(other.citationCount, citationCount) || other.citationCount == citationCount)&&(identical(other.dataStatus, dataStatus) || other.dataStatus == dataStatus)&&(identical(other.dataQualityScore, dataQualityScore) || other.dataQualityScore == dataQualityScore)&&(identical(other.isAiAnalyzable, isAiAnalyzable) || other.isAiAnalyzable == isAiAnalyzable)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.abstractText, abstractText) || other.abstractText == abstractText)&&const DeepCollectionEquality().equals(other.authors, authors)&&(identical(other.journalName, journalName) || other.journalName == journalName)&&(identical(other.paperKind, paperKind) || other.paperKind == paperKind)&&(identical(other.openAccessStatus, openAccessStatus) || other.openAccessStatus == openAccessStatus)&&(identical(other.openAccessUrl, openAccessUrl) || other.openAccessUrl == openAccessUrl)&&const DeepCollectionEquality().equals(other.keywords, keywords)&&const DeepCollectionEquality().equals(other.topics, topics)&&(identical(other.downloadCost, downloadCost) || other.downloadCost == downloadCost)&&(identical(other.uploadCreditReward, uploadCreditReward) || other.uploadCreditReward == uploadCreditReward)&&(identical(other.pdfPath, pdfPath) || other.pdfPath == pdfPath)&&(identical(other.paperLink, paperLink) || other.paperLink == paperLink)&&(identical(other.paperStatus, paperStatus) || other.paperStatus == paperStatus)&&(identical(other.rejectionReason, rejectionReason) || other.rejectionReason == rejectionReason));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,title,publicationYear,citationCount,dataStatus,dataQualityScore,isAiAnalyzable,createdAt,updatedAt,abstractText,const DeepCollectionEquality().hash(authors),journalName,paperKind,openAccessStatus,openAccessUrl,const DeepCollectionEquality().hash(keywords),const DeepCollectionEquality().hash(topics),downloadCost,uploadCreditReward,pdfPath,paperLink,paperStatus,rejectionReason]);

@override
String toString() {
  return 'Paper(id: $id, title: $title, publicationYear: $publicationYear, citationCount: $citationCount, dataStatus: $dataStatus, dataQualityScore: $dataQualityScore, isAiAnalyzable: $isAiAnalyzable, createdAt: $createdAt, updatedAt: $updatedAt, abstractText: $abstractText, authors: $authors, journalName: $journalName, paperKind: $paperKind, openAccessStatus: $openAccessStatus, openAccessUrl: $openAccessUrl, keywords: $keywords, topics: $topics, downloadCost: $downloadCost, uploadCreditReward: $uploadCreditReward, pdfPath: $pdfPath, paperLink: $paperLink, paperStatus: $paperStatus, rejectionReason: $rejectionReason)';
}


}

/// @nodoc
abstract mixin class $PaperCopyWith<$Res>  {
  factory $PaperCopyWith(Paper value, $Res Function(Paper) _then) = _$PaperCopyWithImpl;
@useResult
$Res call({
 String id, String title, int publicationYear, int citationCount, String dataStatus, double dataQualityScore, bool isAiAnalyzable, String createdAt, String updatedAt, String? abstractText, List<PaperAuthorRef> authors, String? journalName, String? paperKind, String? openAccessStatus, String? openAccessUrl, List<PaperKeyword> keywords, List<PaperTopic> topics, double? downloadCost, double? uploadCreditReward, String? pdfPath, String? paperLink, String? paperStatus, String? rejectionReason
});




}
/// @nodoc
class _$PaperCopyWithImpl<$Res>
    implements $PaperCopyWith<$Res> {
  _$PaperCopyWithImpl(this._self, this._then);

  final Paper _self;
  final $Res Function(Paper) _then;

/// Create a copy of Paper
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? title = null,Object? publicationYear = null,Object? citationCount = null,Object? dataStatus = null,Object? dataQualityScore = null,Object? isAiAnalyzable = null,Object? createdAt = null,Object? updatedAt = null,Object? abstractText = freezed,Object? authors = null,Object? journalName = freezed,Object? paperKind = freezed,Object? openAccessStatus = freezed,Object? openAccessUrl = freezed,Object? keywords = null,Object? topics = null,Object? downloadCost = freezed,Object? uploadCreditReward = freezed,Object? pdfPath = freezed,Object? paperLink = freezed,Object? paperStatus = freezed,Object? rejectionReason = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,publicationYear: null == publicationYear ? _self.publicationYear : publicationYear // ignore: cast_nullable_to_non_nullable
as int,citationCount: null == citationCount ? _self.citationCount : citationCount // ignore: cast_nullable_to_non_nullable
as int,dataStatus: null == dataStatus ? _self.dataStatus : dataStatus // ignore: cast_nullable_to_non_nullable
as String,dataQualityScore: null == dataQualityScore ? _self.dataQualityScore : dataQualityScore // ignore: cast_nullable_to_non_nullable
as double,isAiAnalyzable: null == isAiAnalyzable ? _self.isAiAnalyzable : isAiAnalyzable // ignore: cast_nullable_to_non_nullable
as bool,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String,abstractText: freezed == abstractText ? _self.abstractText : abstractText // ignore: cast_nullable_to_non_nullable
as String?,authors: null == authors ? _self.authors : authors // ignore: cast_nullable_to_non_nullable
as List<PaperAuthorRef>,journalName: freezed == journalName ? _self.journalName : journalName // ignore: cast_nullable_to_non_nullable
as String?,paperKind: freezed == paperKind ? _self.paperKind : paperKind // ignore: cast_nullable_to_non_nullable
as String?,openAccessStatus: freezed == openAccessStatus ? _self.openAccessStatus : openAccessStatus // ignore: cast_nullable_to_non_nullable
as String?,openAccessUrl: freezed == openAccessUrl ? _self.openAccessUrl : openAccessUrl // ignore: cast_nullable_to_non_nullable
as String?,keywords: null == keywords ? _self.keywords : keywords // ignore: cast_nullable_to_non_nullable
as List<PaperKeyword>,topics: null == topics ? _self.topics : topics // ignore: cast_nullable_to_non_nullable
as List<PaperTopic>,downloadCost: freezed == downloadCost ? _self.downloadCost : downloadCost // ignore: cast_nullable_to_non_nullable
as double?,uploadCreditReward: freezed == uploadCreditReward ? _self.uploadCreditReward : uploadCreditReward // ignore: cast_nullable_to_non_nullable
as double?,pdfPath: freezed == pdfPath ? _self.pdfPath : pdfPath // ignore: cast_nullable_to_non_nullable
as String?,paperLink: freezed == paperLink ? _self.paperLink : paperLink // ignore: cast_nullable_to_non_nullable
as String?,paperStatus: freezed == paperStatus ? _self.paperStatus : paperStatus // ignore: cast_nullable_to_non_nullable
as String?,rejectionReason: freezed == rejectionReason ? _self.rejectionReason : rejectionReason // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [Paper].
extension PaperPatterns on Paper {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Paper value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Paper() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Paper value)  $default,){
final _that = this;
switch (_that) {
case _Paper():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Paper value)?  $default,){
final _that = this;
switch (_that) {
case _Paper() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String title,  int publicationYear,  int citationCount,  String dataStatus,  double dataQualityScore,  bool isAiAnalyzable,  String createdAt,  String updatedAt,  String? abstractText,  List<PaperAuthorRef> authors,  String? journalName,  String? paperKind,  String? openAccessStatus,  String? openAccessUrl,  List<PaperKeyword> keywords,  List<PaperTopic> topics,  double? downloadCost,  double? uploadCreditReward,  String? pdfPath,  String? paperLink,  String? paperStatus,  String? rejectionReason)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Paper() when $default != null:
return $default(_that.id,_that.title,_that.publicationYear,_that.citationCount,_that.dataStatus,_that.dataQualityScore,_that.isAiAnalyzable,_that.createdAt,_that.updatedAt,_that.abstractText,_that.authors,_that.journalName,_that.paperKind,_that.openAccessStatus,_that.openAccessUrl,_that.keywords,_that.topics,_that.downloadCost,_that.uploadCreditReward,_that.pdfPath,_that.paperLink,_that.paperStatus,_that.rejectionReason);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String title,  int publicationYear,  int citationCount,  String dataStatus,  double dataQualityScore,  bool isAiAnalyzable,  String createdAt,  String updatedAt,  String? abstractText,  List<PaperAuthorRef> authors,  String? journalName,  String? paperKind,  String? openAccessStatus,  String? openAccessUrl,  List<PaperKeyword> keywords,  List<PaperTopic> topics,  double? downloadCost,  double? uploadCreditReward,  String? pdfPath,  String? paperLink,  String? paperStatus,  String? rejectionReason)  $default,) {final _that = this;
switch (_that) {
case _Paper():
return $default(_that.id,_that.title,_that.publicationYear,_that.citationCount,_that.dataStatus,_that.dataQualityScore,_that.isAiAnalyzable,_that.createdAt,_that.updatedAt,_that.abstractText,_that.authors,_that.journalName,_that.paperKind,_that.openAccessStatus,_that.openAccessUrl,_that.keywords,_that.topics,_that.downloadCost,_that.uploadCreditReward,_that.pdfPath,_that.paperLink,_that.paperStatus,_that.rejectionReason);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String title,  int publicationYear,  int citationCount,  String dataStatus,  double dataQualityScore,  bool isAiAnalyzable,  String createdAt,  String updatedAt,  String? abstractText,  List<PaperAuthorRef> authors,  String? journalName,  String? paperKind,  String? openAccessStatus,  String? openAccessUrl,  List<PaperKeyword> keywords,  List<PaperTopic> topics,  double? downloadCost,  double? uploadCreditReward,  String? pdfPath,  String? paperLink,  String? paperStatus,  String? rejectionReason)?  $default,) {final _that = this;
switch (_that) {
case _Paper() when $default != null:
return $default(_that.id,_that.title,_that.publicationYear,_that.citationCount,_that.dataStatus,_that.dataQualityScore,_that.isAiAnalyzable,_that.createdAt,_that.updatedAt,_that.abstractText,_that.authors,_that.journalName,_that.paperKind,_that.openAccessStatus,_that.openAccessUrl,_that.keywords,_that.topics,_that.downloadCost,_that.uploadCreditReward,_that.pdfPath,_that.paperLink,_that.paperStatus,_that.rejectionReason);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Paper implements Paper {
  const _Paper({required this.id, required this.title, required this.publicationYear, required this.citationCount, required this.dataStatus, required this.dataQualityScore, required this.isAiAnalyzable, required this.createdAt, required this.updatedAt, this.abstractText, final  List<PaperAuthorRef> authors = const [], this.journalName, this.paperKind, this.openAccessStatus, this.openAccessUrl, final  List<PaperKeyword> keywords = const [], final  List<PaperTopic> topics = const [], this.downloadCost, this.uploadCreditReward, this.pdfPath, this.paperLink, this.paperStatus, this.rejectionReason}): _authors = authors,_keywords = keywords,_topics = topics;
  factory _Paper.fromJson(Map<String, dynamic> json) => _$PaperFromJson(json);

@override final  String id;
@override final  String title;
@override final  int publicationYear;
@override final  int citationCount;
@override final  String dataStatus;
@override final  double dataQualityScore;
@override final  bool isAiAnalyzable;
@override final  String createdAt;
@override final  String updatedAt;
@override final  String? abstractText;
 final  List<PaperAuthorRef> _authors;
@override@JsonKey() List<PaperAuthorRef> get authors {
  if (_authors is EqualUnmodifiableListView) return _authors;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_authors);
}

@override final  String? journalName;
@override final  String? paperKind;
@override final  String? openAccessStatus;
@override final  String? openAccessUrl;
 final  List<PaperKeyword> _keywords;
@override@JsonKey() List<PaperKeyword> get keywords {
  if (_keywords is EqualUnmodifiableListView) return _keywords;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_keywords);
}

 final  List<PaperTopic> _topics;
@override@JsonKey() List<PaperTopic> get topics {
  if (_topics is EqualUnmodifiableListView) return _topics;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_topics);
}

@override final  double? downloadCost;
@override final  double? uploadCreditReward;
@override final  String? pdfPath;
@override final  String? paperLink;
@override final  String? paperStatus;
@override final  String? rejectionReason;

/// Create a copy of Paper
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PaperCopyWith<_Paper> get copyWith => __$PaperCopyWithImpl<_Paper>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PaperToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Paper&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.publicationYear, publicationYear) || other.publicationYear == publicationYear)&&(identical(other.citationCount, citationCount) || other.citationCount == citationCount)&&(identical(other.dataStatus, dataStatus) || other.dataStatus == dataStatus)&&(identical(other.dataQualityScore, dataQualityScore) || other.dataQualityScore == dataQualityScore)&&(identical(other.isAiAnalyzable, isAiAnalyzable) || other.isAiAnalyzable == isAiAnalyzable)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.abstractText, abstractText) || other.abstractText == abstractText)&&const DeepCollectionEquality().equals(other._authors, _authors)&&(identical(other.journalName, journalName) || other.journalName == journalName)&&(identical(other.paperKind, paperKind) || other.paperKind == paperKind)&&(identical(other.openAccessStatus, openAccessStatus) || other.openAccessStatus == openAccessStatus)&&(identical(other.openAccessUrl, openAccessUrl) || other.openAccessUrl == openAccessUrl)&&const DeepCollectionEquality().equals(other._keywords, _keywords)&&const DeepCollectionEquality().equals(other._topics, _topics)&&(identical(other.downloadCost, downloadCost) || other.downloadCost == downloadCost)&&(identical(other.uploadCreditReward, uploadCreditReward) || other.uploadCreditReward == uploadCreditReward)&&(identical(other.pdfPath, pdfPath) || other.pdfPath == pdfPath)&&(identical(other.paperLink, paperLink) || other.paperLink == paperLink)&&(identical(other.paperStatus, paperStatus) || other.paperStatus == paperStatus)&&(identical(other.rejectionReason, rejectionReason) || other.rejectionReason == rejectionReason));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,title,publicationYear,citationCount,dataStatus,dataQualityScore,isAiAnalyzable,createdAt,updatedAt,abstractText,const DeepCollectionEquality().hash(_authors),journalName,paperKind,openAccessStatus,openAccessUrl,const DeepCollectionEquality().hash(_keywords),const DeepCollectionEquality().hash(_topics),downloadCost,uploadCreditReward,pdfPath,paperLink,paperStatus,rejectionReason]);

@override
String toString() {
  return 'Paper(id: $id, title: $title, publicationYear: $publicationYear, citationCount: $citationCount, dataStatus: $dataStatus, dataQualityScore: $dataQualityScore, isAiAnalyzable: $isAiAnalyzable, createdAt: $createdAt, updatedAt: $updatedAt, abstractText: $abstractText, authors: $authors, journalName: $journalName, paperKind: $paperKind, openAccessStatus: $openAccessStatus, openAccessUrl: $openAccessUrl, keywords: $keywords, topics: $topics, downloadCost: $downloadCost, uploadCreditReward: $uploadCreditReward, pdfPath: $pdfPath, paperLink: $paperLink, paperStatus: $paperStatus, rejectionReason: $rejectionReason)';
}


}

/// @nodoc
abstract mixin class _$PaperCopyWith<$Res> implements $PaperCopyWith<$Res> {
  factory _$PaperCopyWith(_Paper value, $Res Function(_Paper) _then) = __$PaperCopyWithImpl;
@override @useResult
$Res call({
 String id, String title, int publicationYear, int citationCount, String dataStatus, double dataQualityScore, bool isAiAnalyzable, String createdAt, String updatedAt, String? abstractText, List<PaperAuthorRef> authors, String? journalName, String? paperKind, String? openAccessStatus, String? openAccessUrl, List<PaperKeyword> keywords, List<PaperTopic> topics, double? downloadCost, double? uploadCreditReward, String? pdfPath, String? paperLink, String? paperStatus, String? rejectionReason
});




}
/// @nodoc
class __$PaperCopyWithImpl<$Res>
    implements _$PaperCopyWith<$Res> {
  __$PaperCopyWithImpl(this._self, this._then);

  final _Paper _self;
  final $Res Function(_Paper) _then;

/// Create a copy of Paper
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? title = null,Object? publicationYear = null,Object? citationCount = null,Object? dataStatus = null,Object? dataQualityScore = null,Object? isAiAnalyzable = null,Object? createdAt = null,Object? updatedAt = null,Object? abstractText = freezed,Object? authors = null,Object? journalName = freezed,Object? paperKind = freezed,Object? openAccessStatus = freezed,Object? openAccessUrl = freezed,Object? keywords = null,Object? topics = null,Object? downloadCost = freezed,Object? uploadCreditReward = freezed,Object? pdfPath = freezed,Object? paperLink = freezed,Object? paperStatus = freezed,Object? rejectionReason = freezed,}) {
  return _then(_Paper(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,publicationYear: null == publicationYear ? _self.publicationYear : publicationYear // ignore: cast_nullable_to_non_nullable
as int,citationCount: null == citationCount ? _self.citationCount : citationCount // ignore: cast_nullable_to_non_nullable
as int,dataStatus: null == dataStatus ? _self.dataStatus : dataStatus // ignore: cast_nullable_to_non_nullable
as String,dataQualityScore: null == dataQualityScore ? _self.dataQualityScore : dataQualityScore // ignore: cast_nullable_to_non_nullable
as double,isAiAnalyzable: null == isAiAnalyzable ? _self.isAiAnalyzable : isAiAnalyzable // ignore: cast_nullable_to_non_nullable
as bool,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String,abstractText: freezed == abstractText ? _self.abstractText : abstractText // ignore: cast_nullable_to_non_nullable
as String?,authors: null == authors ? _self._authors : authors // ignore: cast_nullable_to_non_nullable
as List<PaperAuthorRef>,journalName: freezed == journalName ? _self.journalName : journalName // ignore: cast_nullable_to_non_nullable
as String?,paperKind: freezed == paperKind ? _self.paperKind : paperKind // ignore: cast_nullable_to_non_nullable
as String?,openAccessStatus: freezed == openAccessStatus ? _self.openAccessStatus : openAccessStatus // ignore: cast_nullable_to_non_nullable
as String?,openAccessUrl: freezed == openAccessUrl ? _self.openAccessUrl : openAccessUrl // ignore: cast_nullable_to_non_nullable
as String?,keywords: null == keywords ? _self._keywords : keywords // ignore: cast_nullable_to_non_nullable
as List<PaperKeyword>,topics: null == topics ? _self._topics : topics // ignore: cast_nullable_to_non_nullable
as List<PaperTopic>,downloadCost: freezed == downloadCost ? _self.downloadCost : downloadCost // ignore: cast_nullable_to_non_nullable
as double?,uploadCreditReward: freezed == uploadCreditReward ? _self.uploadCreditReward : uploadCreditReward // ignore: cast_nullable_to_non_nullable
as double?,pdfPath: freezed == pdfPath ? _self.pdfPath : pdfPath // ignore: cast_nullable_to_non_nullable
as String?,paperLink: freezed == paperLink ? _self.paperLink : paperLink // ignore: cast_nullable_to_non_nullable
as String?,paperStatus: freezed == paperStatus ? _self.paperStatus : paperStatus // ignore: cast_nullable_to_non_nullable
as String?,rejectionReason: freezed == rejectionReason ? _self.rejectionReason : rejectionReason // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
