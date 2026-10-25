import type { SiteContent } from "@/lib/content/schema";
import type { CollectionName, Collections } from "@/lib/domain";

export type FileBlob = { bytes: Uint8Array; contentType: string };

export interface Store {
  getContent(): Promise<SiteContent>;
  /** Read-modify-write of the editable site content (validated). */
  updateContent(mutate: (content: SiteContent) => void): Promise<SiteContent>;

  list<K extends CollectionName>(name: K, filter?: (item: Collections[K]) => boolean): Promise<Collections[K][]>;
  get<K extends CollectionName>(name: K, id: string): Promise<Collections[K] | null>;
  insert<K extends CollectionName>(name: K, item: Collections[K]): Promise<void>;
  update<K extends CollectionName>(name: K, id: string, patch: Partial<Collections[K]>): Promise<Collections[K] | null>;
  remove<K extends CollectionName>(name: K, id: string): Promise<void>;

  /** Public site photos uploaded from the staff panel, served by /api/media. */
  savePublicFile(name: string, bytes: Uint8Array, contentType: string): Promise<string>;
  readPublicFile(name: string): Promise<FileBlob | null>;
  deletePublicFile(url: string): Promise<void>;

  /** Private files (certificates). Served only through /api/files after an access check. */
  savePrivateFile(id: string, bytes: Uint8Array, contentType: string): Promise<void>;
  readPrivateFile(id: string): Promise<FileBlob | null>;
  deletePrivateFile(id: string): Promise<void>;
}
