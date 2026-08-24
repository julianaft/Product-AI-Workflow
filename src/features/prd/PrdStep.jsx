import { useCallback } from 'react';
import { PRD_SECTIONS, prdToMarkdown } from '../../../shared/prdSkill.js';
import { HumanGate, SkillPanel } from '../../components/SkillPanel.jsx';
import { BUTTON, INPUT, classNames } from '../../components/ui.js';
import { useSkill } from '../../hooks/useSkill.js';
import { generatePrd } from '../../services/aiClient.js';
import { buildPrdPayload } from '../../services/prdPayload.js';
import { useJourney } from '../../state/JourneyProvider.jsx';

function downloadMarkdown(prd) {
  const blob = new Blob([prdToMarkdown(prd)], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `${prd.title.replace(/\s+/g, '-').toLowerCase()}.md`;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function PrdStep() {
  const { journey, dispatch } = useJourney();
  const { run, loading, error } = useSkill(generatePrd);

  const document = journey.prd.document;
  const approved = journey.prd.status === 'approved';
  const stale = journey.prd.status === 'stale';

  const generate = useCallback(async () => {
    const result = await run(buildPrdPayload(journey));
    if (result) {
      dispatch({ type: 'setPrd', document: result });
    }
  }, [dispatch, journey, run]);

  return (
    <>
      <SkillPanel
        title="Construcao do PRD"
        description="A skill monta um PRD no formato de produto: OKR, pessoas por area, hipoteses com decisao, metricas AS IS/TO BE, jornada por solucao e criterios de aceite verificaveis. O que faltar vira pergunta em aberto."
        runLabel={document ? 'Gerar novamente' : 'Gerar PRD'}
        onRun={generate}
        loading={loading}
        error={error}
        disabled={approved}
      >
        {document ? (
          <p className="text-sm">
            Gerado em {new Date(document.generatedAt).toLocaleString('pt-BR')} a partir de{' '}
            {document.traceability?.framework}.
          </p>
        ) : (
          <p className="text-sm">Nenhum PRD gerado ainda.</p>
        )}
      </SkillPanel>

      {stale ? (
        <p className="border border-orange rounded-xl px-4 py-3 text-sm font-bold mb-6">
          O contexto mudou depois desta geracao. Gere o PRD novamente para refletir as alteracoes.
        </p>
      ) : null}

      {document ? (
        <>
          <div className="print-area border border-line rounded-2xl p-5 md:p-8 mb-6">
            <h3 className="text-2xl md:text-3xl font-extrabold border-b border-line pb-3 mb-5">
              {document.title}
            </h3>

            <MetadataTable metadata={document.metadata} />

            {PRD_SECTIONS.map((section) => (
              <section key={section.key} className="mb-6">
                <h4 className="font-extrabold border-b border-line pb-1 mb-1">{section.label}</h4>
                {section.quality ? <p className="text-sm text-blue mb-2">{section.quality}</p> : null}
                <textarea
                  aria-label={section.label}
                  className={classNames(INPUT, 'resize-y')}
                  rows={Math.min(
                    16,
                    Math.max(4, String(document.sections[section.key] ?? '').split('\n').length + 1),
                  )}
                  value={document.sections[section.key] ?? ''}
                  disabled={approved}
                  onChange={(event) =>
                    dispatch({
                      type: 'updatePrdSection',
                      section: section.key,
                      value: event.target.value,
                    })
                  }
                />
              </section>
            ))}

            {document.openQuestions?.length ? (
              <section className="mb-6">
                <h4 className="font-extrabold border-b border-line pb-1 mb-2">
                  Perguntas em aberto
                </h4>
                <ul className="text-sm space-y-1">
                  {document.openQuestions.map((question) => (
                    <li key={question}>- {question}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {document.references?.length ? (
              <section>
                <h4 className="font-extrabold border-b border-line pb-1 mb-2">Links importantes</h4>
                <ul className="text-sm space-y-1">
                  {document.references.map((reference) => (
                    <li key={reference.url}>
                      <a href={reference.url} target="_blank" rel="noreferrer" className="text-blue underline break-all">
                        {reference.title || reference.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <HumanGate>
            {approved
              ? 'PRD aprovado. Reabra para editar.'
              : 'o PRD precisa de aprovacao antes de circular com o time.'}
          </HumanGate>

          <div className="no-print flex flex-wrap gap-3">
            {approved ? (
              <button
                type="button"
                className={BUTTON.secondary}
                onClick={() => dispatch({ type: 'reopenPrd' })}
              >
                Reabrir para edicao
              </button>
            ) : (
              <button
                type="button"
                className={BUTTON.success}
                onClick={() => dispatch({ type: 'approvePrd' })}
              >
                Aprovar PRD
              </button>
            )}

            <button type="button" className={BUTTON.quiet} onClick={() => downloadMarkdown(document)}>
              Exportar Markdown
            </button>

            <button type="button" className={BUTTON.quiet} onClick={() => window.print()}>
              Imprimir / PDF
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}

function MetadataTable({ metadata = {} }) {
  const rows = [
    ['Dir.', metadata.directorate],
    ['Produto', metadata.product],
    ['Tribo', metadata.tribe],
    ['Squad', metadata.squad],
    ['PM / GPM', metadata.pm],
    ['PD', metadata.pd],
    ['Redatores', (metadata.writers ?? []).join(', ')],
    ['TM', metadata.tm],
    ['TL', metadata.tl],
    ['Iniciativa OKR', metadata.okrCode],
    ['Tipo da iniciativa', metadata.initiativeType === 'new' ? 'Novo fluxo' : 'Incremental'],
    ['Discovery', metadata.discoveryFramework],
  ];

  return (
    <table className="w-full text-sm border border-line mb-6">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-line">
            <th className="text-left font-bold p-3 bg-canvas w-1/3">{label}</th>
            <td className="p-3">{value || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
