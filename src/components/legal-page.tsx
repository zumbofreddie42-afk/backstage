import { Container, Notice, PageHero, RichText } from "@/components/ui";

export function LegalPage({ title, draftNote, preview, sections }: { title: string; draftNote: string; preview: boolean; sections: { title: string; text: string }[] }) {
  return (
    <>
      <PageHero title={title} />
      <Container className="max-w-3xl py-14">
        {preview && <Notice tone="warn">{draftNote}</Notice>}
        <div className="mt-8 space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-2xl font-extrabold text-ink">{s.title}</h2>
              <RichText text={s.text} preview={preview} className="mt-3" />
            </section>
          ))}
        </div>
      </Container>
    </>
  );
}
