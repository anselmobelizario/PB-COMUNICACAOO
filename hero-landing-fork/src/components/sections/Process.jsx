import { useReveal } from '../../hooks/useReveal';
import StepIcon from '../icons/StepIcon';
import { siteData } from '../../data/siteData';

export default function Process() {
  const revealRef = useReveal();
  const { process } = siteData;

  return (
    <section
      className="process-section relative z-10 bg-[var(--color-pb-white)] px-6 py-6"
      aria-labelledby="process-heading"
    >
      <div ref={revealRef} className="reveal-section mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div className="flex min-w-0 flex-col justify-center">
            <span className="section-kicker-light">{process.label}</span>
            <h2
              id="process-heading"
              className="process-heading mt-6 font-[var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            >
              {process.headline.before}
              <span className="process-heading-mark">{process.headline.accent}</span>
              {process.headline.after}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-pb-ink-2)] sm:text-lg">
              {process.subheadline}
            </p>
          </div>

          <ol className="editorial-surface-light process-steps rounded-[1.75rem] px-6 sm:px-8">
            {process.steps.map((step) => (
              <li key={step.num} className="process-step">
                <div className="benefit-row-meta process-step-meta">
                  <span className="benefit-row-index">{step.num}</span>
                  <div className="benefit-row-icon">
                    <StepIcon name={step.icon} />
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="font-[var(--font-display)] text-lg font-semibold tracking-tight text-[var(--color-pb-ink)] sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-pb-ink-2)] sm:text-[0.95rem]">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
