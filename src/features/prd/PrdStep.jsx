import { useCallback, useState } from 'react';
import { PRD_SECTIONS } from '../../../shared/prdSkill.js';
import { HumanGate, SkillPanel } from '../../components/SkillPanel.jsx';
import { PrdRevisionChat, createMessage } from '../../components/PrdRevisionChat.jsx';
import { BUTTON, INPUT, classNames } from '../../components/ui.js';
import { useSkill } from '../../hooks/useSkill.js';
import { generatePrd, revisePrd } from '../../services/aiClient.js';
import { buildPrdPayload } from '../../services/prdPayload.js';
import { copyPrdForGoogleDocs, downloadPrdDoc } from '../../services/prdExport.js';
import { useJourney } from '../../state/JourneyProvider.jsx';

export function PrdStep() {
  const { journey, dispatch } = useJourney();
  const { run, loading, error } = useSkill(generatePrd);
  const {
    run: runRevision,
    loading: revisionLoading,
    error: revisionError,
  } = useSkill(revisePrd);
  const [copyStatus, setCopyStatus] = useState('');

  const document = journey.prd.document;
  const approved = journey.prd.status === 'approved';
  const stale = journey.prd.status === 'stale';

  const generate = useCallback(async () => {
    const result = await run(buildPrdPayload(journey));
    if (result) {
      dispatch({ type: 'setPrd', document: result });
    }
  }, [dispatch, journey, run]);

  const sendRevision = useCallback(
    async (content) => {
      const userMessage = createMessage('user', content);
      dispatch({ type: 'appendPrdChat', message: userMessage });

      const result = await runRevision({
        payload: buildPrdPayload(journey),
        currentPrd: journey.prd.document,
        instruction: content,
        conversation: [...(journey.prd.chat ?? []), userMessage],
      });

      if (result?.prd) {
        dispatch({
          type: 'applyPrdRevision',
          document: result.prd,
          answers: result.answers,
          message: createMessage('assistant', result.reply, { revision: result.prd.revision }),
        });
      }
    },
    [dispatch, journey, runRevision],
  );

  async function copyForGoogleDocs() {
    try {
      await copyPrdForGoogleDocs(document);
      setCopyStatus('PRD copiado. Cole diretamente no Google Docs.');
    } catch {
      setCopyStatus('Não foi possível copiar. Use a exportação DOC.');
    }
  }

  return (
    <>
      <SkillPanel
        title="Construção do PRD"
        description="A skill monta um PRD no formato de produto: OKR, pessoas por área, hipóteses com decisão, métricas AS IS/TO BE, jornada por solução e critérios de aceite verificáveis. O que faltar vira pergunta em aberto."
        runLabel={document ? 'Gerar novamente' : 'Gerar PRD'}
        onRun={generate}
        loading={loading}
        error={error}
        disabled={approved || revisionLoading}
      >
        {document ? (
          <p className="text-sm">
            Versão {document.revision ?? 1} gerada em{' '}
            {new Date(document.generatedAt).toLocaleString('pt-BR')} a partir de{' '}
            {document.traceability?.framework}. Use o chat abaixo para responder perguntas
            ou pedir alterações sem perder o restante do documento.
          </p>
        ) : (
          <p className="text-sm">Nenhum PRD gerado ainda.</p>
        )}
      </SkillPanel>

      {stale ? (
        <p className="border border-orange rounded-xl px-4 py-3 text-sm font-bold mb-6">
          O contexto mudou depois desta geração. Gere o PRD novamente para refletir as alterações.
        </p>
      ) : null}

      {document ? (
        <>
          <div className="print-area border border-line rounded-2xl p-5 md:p-8 mb-6">
            <h3 className="text-2xl md:text-3xl font-extrabold border-b border-line pb-3 mb-5">
              {document.title}
              <span className="block text-sm font-bold text-blue mt-2">
                Versão {document.revision ?? 1}
              </span>
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

          <PrdRevisionChat
            document={document}
            chat={journey.prd.chat}
            openQuestions={document.openQuestions}
            disabled={approved}
            loading={revisionLoading}
            error={revisionError}
            onSend={sendRevision}
          />

          <HumanGate>
            {approved
              ? 'PRD aprovado. Reabra para editar.'
              : 'o PRD precisa de aprovação antes de circular com o time.'}
          </HumanGate>

          <div className="no-print flex flex-wrap gap-3">
            {approved ? (
              <button
                type="button"
                className={BUTTON.secondary}
                onClick={() => dispatch({ type: 'reopenPrd' })}
              >
                Reabrir para edição
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

            <button type="button" className={BUTTON.primary} onClick={() => downloadPrdDoc(document)}>
              Exportar DOC
            </button>

            <button type="button" className={BUTTON.quiet} onClick={copyForGoogleDocs}>
              Copiar para Google Docs
            </button>
          </div>
          {copyStatus ? <p className="text-sm font-semibold text-blue mt-3">{copyStatus}</p> : null}
        </>
      ) : null}
    </>
  );
}

function MetadataTable({ metadata = {} }) {
  const rows = [
    ['Produto', metadata.product],
    ['PM', metadata.pm],
    ['PD', metadata.pd],
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
