export type Selection =
  | { kind: "none" }
  | { kind: "field"; sectionId: string; rowId: string; fieldId: string }
  | { kind: "section"; sectionId: string }
  | { kind: "row"; sectionId: string; rowId: string };

export type LibraryDragKind = "richText" | "divider" | "image" | "heading" | "consent";

export type DragData =
  | { source: "libraryProperty"; propertyId: string }
  | { source: "libraryField"; fieldType: string; displayName: string }
  | { source: "libraryElement"; elementKind: LibraryDragKind }
  | { source: "row"; rowId: string; sectionId: string }
  | { source: "field"; fieldId: string; rowId: string; sectionId: string }
  | { source: "section"; sectionId: string };

export type DropData =
  | { kind: "section-area"; sectionId: string }
  | { kind: "row"; sectionId: string; rowId: string }
  | { kind: "row-slot"; sectionId: string; rowId: string; slotIndex: number }
  | { kind: "between-rows"; sectionId: string; index: number }
  | { kind: "section-list"; index: number };
