import Image from "next/image";
import { notFound } from "next/navigation";
import { BackLink, Field, Panel, StaffPage, SubmitButton } from "@/components/staff";
import { StaffFlash } from "@/components/staff-flash";
import { buttonClass } from "@/components/ui";
import { getByPath, getSection, joinPath, listOf, type FieldDef } from "@/lib/content/editor";
import { requireStaff } from "@/server/auth";
import { readFlash } from "@/server/flash";
import { getStore } from "@/server/store";
import { addListItem, moveListItem, removePortrait, saveSection, uploadPhoto } from "../../../actions";

/** Id of the small hidden form that a list button submits (buttons cannot carry values into server actions). */
function formId(path: string, index: number, action: string) {
  return `f-${path.replace(/\./g, "-")}-${index}-${action}`;
}

function Input({ field, name, value }: { field: FieldDef; name: string; value: unknown }) {
  const id = name.replace(/\./g, "-");
  switch (field.kind) {
    case "l":
    case "l-long": {
      const v = (value ?? { it: "", en: "" }) as { it: string; en: string };
      const long = field.kind === "l-long";
      return (
        <fieldset className="rounded-xl border border-border p-3">
          <legend className="px-1 text-sm font-semibold text-ink">{field.label}</legend>
          <div className="grid gap-3 lg:grid-cols-2">
            {(["it", "en"] as const).map((lang) => (
              <div key={lang}>
                <label htmlFor={`${id}-${lang}`} className="text-xs font-bold uppercase text-muted-foreground">
                  {lang === "it" ? "Italiano" : "English"}
                </label>
                {long ? (
                  <textarea id={`${id}-${lang}`} name={`${name}.${lang}`} defaultValue={v[lang]} rows={5} className={`field mt-1 ${/\{\{/.test(v[lang]) ? "bg-magenta-soft" : ""}`} />
                ) : (
                  <input id={`${id}-${lang}`} name={`${name}.${lang}`} defaultValue={v[lang]} className={`field mt-1 ${/\{\{/.test(v[lang]) ? "bg-magenta-soft" : ""}`} />
                )}
              </div>
            ))}
          </div>
          {field.hint && <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>}
        </fieldset>
      );
    }
    case "bool":
      return (
        <label className="flex items-center gap-2 font-semibold">
          <input type="checkbox" name={name} defaultChecked={Boolean(value)} className="h-5 w-5 accent-primary" /> {field.label}
        </label>
      );
    case "select":
      return (
        <Field label={field.label} htmlFor={id}>
          <select id={id} name={name} defaultValue={String(value ?? "")} className="field">
            {field.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      );
    default:
      return (
        <Field label={field.label} htmlFor={id} hint={field.hint}>
          <input
            id={id}
            name={name}
            type={field.kind === "url" ? "url" : field.kind === "number" ? "number" : "text"}
            defaultValue={String(value ?? "")}
            className={`field ${/\{\{/.test(String(value ?? "")) ? "bg-magenta-soft" : ""}`}
          />
        </Field>
      );
  }
}

export default async function SectionEditor({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: Promise<{ errore?: string }> }) {
  await requireStaff("admin");
  const { section: key } = await params;
  const { errore } = await searchParams;
  const section = getSection(key);
  if (!section) notFound();
  const content = await getStore().getContent();

  return (
    <StaffPage title={section.title} intro={section.description} actions={<BackLink href="/staff/contenuti">Tutte le sezioni</BackLink>}>
      <StaffFlash message={await readFlash()} />
      {errore && (
        <p role="alert" className="rounded-xl bg-danger-soft p-3 font-semibold text-danger">
          {errore === "foto" ? "La foto deve essere JPG, PNG o WebP e pesare al massimo 4 MB." : "Non è stato possibile salvare: controlla i campi."}
        </p>
      )}

      {section.photos && (
        <Panel title="Foto">
          <div className="grid gap-6 md:grid-cols-2">
            <form action={uploadPhoto} className="space-y-3 rounded-xl border border-border p-4">
              <input type="hidden" name="target" value="portrait" />
              <p className="font-semibold">Ritratto di Christina Back</p>
              {content.about.portrait.url ? (
                <Image src={content.about.portrait.url} alt="" width={160} height={160} className="h-40 w-40 rounded-full object-cover" />
              ) : (
                <p className="text-sm text-muted-foreground">Nessuna foto caricata.</p>
              )}
              <Field label="Nuova foto (JPG, PNG o WebP, max 4 MB)" htmlFor="portrait-file">
                <input id="portrait-file" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required className="text-sm" />
              </Field>
              <SubmitButton small>Carica ritratto</SubmitButton>
            </form>
            <form action={uploadPhoto} className="space-y-3 rounded-xl border border-border p-4">
              <input type="hidden" name="target" value="gallery" />
              <p className="font-semibold">Aggiungi una foto alla galleria</p>
              <p className="text-sm text-muted-foreground">Solo foto autentiche fornite dalla scuola, con il consenso delle persone ritratte.</p>
              <Field label="File" htmlFor="gallery-file">
                <input id="gallery-file" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required className="text-sm" />
              </Field>
              <Field label="Descrizione (italiano)" htmlFor="gallery-alt-it">
                <input id="gallery-alt-it" name="alt.it" className="field" />
              </Field>
              <Field label="Description (English)" htmlFor="gallery-alt-en">
                <input id="gallery-alt-en" name="alt.en" className="field" />
              </Field>
              <SubmitButton small>Carica foto</SubmitButton>
            </form>
          </div>
          {content.about.portrait.url && (
            <form action={removePortrait} className="mt-3">
              <button type="submit" className="text-sm font-semibold text-danger underline">
                Rimuovi il ritratto
              </button>
            </form>
          )}
        </Panel>
      )}

      <form action={saveSection} className="space-y-6">
        <input type="hidden" name="section" value={section.key} />
        {section.fields.length > 0 && (
          <Panel>
            <div className="space-y-4">
              {section.fields.map((f) => (
                <Input key={f.key} field={f} name={f.key} value={getByPath(content, f.key)} />
              ))}
            </div>
          </Panel>
        )}

        {section.lists.map((list) => {
          const items = listOf(content, list.path);
          return (
            <Panel key={list.path} title={list.title}>
              {items.length === 0 && <p className="text-muted-foreground">Nessun elemento.</p>}
              <ol className="space-y-5">
                {items.map((item, i) => {
                  const photoUrl = list.path === "about.photos" ? (item as { url: string }).url : null;
                  return (
                    <li key={i} className="rounded-2xl border-2 border-border p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">
                          {list.itemLabel} {i + 1}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {i > 0 && (
                            <button type="submit" form={formId(list.path, i, "up")} className={buttonClass("soft", "min-h-8 px-3 py-1 text-xs")}>
                              ↑ Su
                            </button>
                          )}
                          {i < items.length - 1 && (
                            <button type="submit" form={formId(list.path, i, "down")} className={buttonClass("soft", "min-h-8 px-3 py-1 text-xs")}>
                              ↓ Giù
                            </button>
                          )}
                          {!list.fixed && (
                            <button type="submit" form={formId(list.path, i, "delete")} className="min-h-8 rounded-full border border-danger/40 px-3 py-1 text-xs font-semibold text-danger hover:bg-danger-soft">
                              Elimina
                            </button>
                          )}
                        </div>
                      </div>
                      {photoUrl && <Image src={photoUrl} alt="" width={240} height={180} className="mb-3 h-32 w-auto rounded-xl object-cover" />}
                      <div className="space-y-3">
                        {list.fields.map((f) => {
                          const name = joinPath(list.path, i, f.key);
                          return <Input key={name} field={f} name={name} value={getByPath(content, name)} />;
                        })}
                      </div>
                    </li>
                  );
                })}
              </ol>
              {!list.fixed && list.newItem && (
                <button type="submit" form={formId(list.path, 0, "add")} className={buttonClass("outline", "mt-4")}>
                  + Aggiungi {list.itemLabel.toLowerCase()}
                </button>
              )}
              <p className="mt-2 text-xs text-muted-foreground">Prima di spostare o aggiungere elementi salva le modifiche, altrimenti vanno perse.</p>
            </Panel>
          );
        })}

        <div id="fine" className="sticky bottom-0 -mx-4 border-t border-border bg-white/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
          <SubmitButton>Salva e pubblica</SubmitButton>
        </div>
      </form>

      {section.lists.flatMap((list) => {
        const items = listOf(content, list.path);
        const forms = [
          !list.fixed && list.newItem ? (
            <form key={formId(list.path, 0, "add")} id={formId(list.path, 0, "add")} action={addListItem} hidden>
              <input type="hidden" name="section" value={section.key} />
              <input type="hidden" name="addList" value={list.path} />
            </form>
          ) : null,
          ...items.flatMap((_item, i) =>
            (["up", "down", "delete"] as const).map((action) => (
              <form key={formId(list.path, i, action)} id={formId(list.path, i, action)} action={moveListItem} hidden>
                <input type="hidden" name="section" value={section.key} />
                <input type="hidden" name="move" value={`${list.path}|${i}|${action}`} />
              </form>
            )),
          ),
        ];
        return forms.filter(Boolean);
      })}
    </StaffPage>
  );
}
