import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, HelpCircle, RotateCcw, XCircle } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Modal, ProgressBar } from '@/components/ui';
import type { QuizResult } from '@/features/learning/learningSlice';
import type { QuizQuestion } from '@/types';
import { cn } from '@/utils/cn';

interface Props {
  title: string;
  questions: QuizQuestion[];
  passMark: number;
  result?: QuizResult;
  hasNext: boolean;
  onSubmit: (answers: (number | null)[]) => void;
  onContinue: () => void;
}

type Phase = 'intro' | 'taking' | 'result';

export function QuizPlayer({ title, questions, passMark, result, hasNext, onSubmit, onContinue }: Props) {
  const [phase, setPhase] = useState<Phase>(result ? 'result' : 'intro');
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [index, setIndex] = useState(0);
  const [confirm, setConfirm] = useState(false);

  if (questions.length === 0) return <Card><EmptyState icon={HelpCircle} title="No quiz available" description="This quiz has no questions yet." /></Card>;

  const unanswered = answers.filter((a) => a === null).length;
  const answered = questions.length - unanswered;
  const question = questions[index];

  const submit = (): void => {
    setConfirm(false);
    onSubmit(answers);
    setPhase('result');
  };
  const retry = (): void => { setAnswers(questions.map(() => null)); setIndex(0); setPhase('taking'); };

  if (phase === 'intro') {
    return (
      <Card className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-700 dark:text-violet-300"><HelpCircle className="h-7 w-7" aria-hidden /></span>
        <h2 className="mt-4 text-xl font-semibold text-fg">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{questions.length} multiple-choice questions. You need {passMark}% to pass and can retry as many times as you like.</p>
        <Button className="mt-6" size="lg" onClick={() => setPhase('taking')}>Start quiz</Button>
      </Card>
    );
  }

  if (phase === 'result' && result) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <Card className="text-center">
          <p className="text-sm font-medium text-muted">Quiz completed</p>
          <p className="mt-2 text-5xl font-bold tracking-tight text-fg">{result.score} / {result.total}</p>
          <p className="mt-1 text-lg text-muted">{result.percentage}%</p>
          <div className="mt-3"><Badge variant={result.passed ? 'success' : 'danger'}>{result.passed ? 'Passed' : `Not passed (need ${passMark}%)`}</Badge></div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={retry} leftIcon={<RotateCcw className="h-4 w-4" />}>Retry quiz</Button>
            {(result.passed || hasNext) && <Button onClick={onContinue}>{hasNext ? 'Continue learning' : 'Finish'}</Button>}
          </div>
        </Card>
        {result.answers.length === questions.length && (
          <Card>
            <h3 className="mb-4 font-semibold text-fg">Review your answers</h3>
            <ol className="space-y-5">
              {questions.map((q, i) => {
                const chosen = result.answers[i];
                const right = chosen === q.correctIndex;
                return (
                  <li key={q.id} className="flex gap-3">
                    {right ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-label="Correct" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-label="Incorrect" />}
                    <div className="min-w-0 text-sm">
                      <p className="font-medium text-fg">{i + 1}. {q.prompt}</p>
                      <p className="mt-1 text-muted">Your answer: <span className={right ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>{chosen === null || chosen === undefined ? 'Not answered' : q.options[chosen]}</span></p>
                      {!right && <p className="text-muted">Correct answer: <span className="text-emerald-700 dark:text-emerald-400">{q.options[q.correctIndex]}</span></p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        )}
      </motion.div>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-fg">Question {index + 1} of {questions.length}</span>
        <span className="text-muted">{answered} answered</span>
      </div>
      <ProgressBar value={answered} max={questions.length} size="sm" label="Quiz progress" />

      <AnimatePresence mode="wait" initial={false}>
        <motion.fieldset key={question.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} className="mt-5 min-w-0">
          <legend className="text-lg font-semibold leading-snug text-fg">{question.prompt}</legend>
          <div className="mt-4 space-y-2.5" role="radiogroup" aria-label={question.prompt}>
            {question.options.map((option, i) => {
              const selected = answers[index] === i;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setAnswers((list) => list.map((a, n) => (n === index ? i : a)))}
                  className={cn('flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition', selected ? 'border-brand bg-brand/10 text-fg' : 'border-line bg-surface text-fg hover:bg-subtle')}
                >
                  <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', selected ? 'border-brand' : 'border-line')}>{selected && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}</span>
                  {option}
                </button>
              );
            })}
          </div>
        </motion.fieldset>
      </AnimatePresence>

      <div className="mt-6 flex flex-wrap gap-1.5" aria-label="Question navigation">
        {questions.map((q, i) => (
          <button key={q.id} type="button" onClick={() => setIndex(i)} aria-label={`Go to question ${i + 1}${answers[i] !== null ? ' (answered)' : ''}`} aria-current={i === index ? 'step' : undefined} className={cn('h-9 w-9 rounded-lg text-sm font-medium transition', i === index ? 'bg-brand text-brand-fg' : answers[i] !== null ? 'bg-brand/15 text-brand-text' : 'bg-subtle text-muted hover:text-fg')}>{i + 1}</button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>Previous</Button>
        {index < questions.length - 1 ? (
          <Button onClick={() => setIndex((i) => i + 1)}>Next</Button>
        ) : (
          <Button onClick={() => (unanswered > 0 ? setConfirm(true) : submit())}>Submit quiz</Button>
        )}
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Submit with unanswered questions?" size="sm" footer={<><Button variant="outline" onClick={() => setConfirm(false)}>Keep working</Button><Button onClick={submit}>Submit anyway</Button></>}>
        <p className="text-sm text-muted">You have {unanswered} unanswered {unanswered === 1 ? 'question' : 'questions'}. Unanswered questions count as incorrect.</p>
      </Modal>
    </Card>
  );
}
