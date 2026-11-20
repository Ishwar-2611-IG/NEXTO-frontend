import { StoreImage } from '../../components/common/StoreImage';
import { useMemo, useRef, useState } from 'react';
import { ArrowRight, CreditCard, Mail, MessageCircle, Package, Phone, RefreshCw, Ruler, Search, Truck, UserRound } from 'lucide-react';
import { AccordionItem } from '../../components/common/AccordionItem';
import { Container } from '../../components/common/Container';
import { HeroBanner } from '../../components/common/HeroBanner';
import { IMG, unsplash } from '../../constants/images';
import { ContactForm } from '../../features/support/ContactForm';
import { FAQS, SUPPORT_CONTACTS, SUPPORT_QUICK_LINKS, SUPPORT_TOPICS } from '../../data/support';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';

const QUICK_LINK_ICONS = [Package, RefreshCw, Truck, Ruler, CreditCard, UserRound];
const CONTACT_ICONS = [Mail, Phone, MessageCircle];

export function SupportPage() {
  usePageTitle('Help & Support');
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);
  const faqRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const faqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? FAQS.filter((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)) : FAQS;
  }, [query]);

  const toggleFaq = (question: string) =>
    setOpenQuestions((prev) => (prev.includes(question) ? prev.filter((x) => x !== question) : [...prev, question]));

  return (
    <div className="space-y-16 pb-20">
      <HeroBanner
        image={unsplash(IMG.clothingRack, 1800)}
        alt="Support Hero"
        eyebrow="HELP & SUPPORT"
        titleLines={['WE’RE', 'HERE', 'FOR YOU.']}
        titleClassName="text-4xl sm:text-7xl"
        description="Have a question? Need help with your order? We’re here to make your NEXTO experience smooth and seamless."
        descriptionClassName="max-w-lg"
        heightClassName="h-[420px] sm:h-[480px]"
        overlayClassName="from-[#F9F6F0]/94 via-[#F9F6F0]/70 to-[#F9F6F0]/12"
        contentClassName="max-w-2xl space-y-6"
      >
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="flex w-full min-w-0 max-w-xl items-center gap-1 bg-[#6B7B6E]/10 backdrop-blur-md border border-[#7E7C77]/25 p-2"
        >
          <span className="flex items-center pl-3 text-[#7E7C77]" aria-hidden="true"><Search size={16} /></span>
          <input
            type="search"
            aria-label="Search help topics"
            placeholder="Search for help (e.g. order, return, size, payment...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-xs text-[#2E2D2B] placeholder-[#7E7C77] px-2 sm:px-3 py-2 focus:outline-none"
          />
          <button type="submit" className="shrink-0 rounded-full bg-[#526457] text-white px-3 sm:px-6 py-2.5 font-extrabold uppercase tracking-[0.12em] text-[9px] sm:text-[10px] hover:bg-[#445549]">Search</button>
        </form>
      </HeroBanner>

      <Container>
        <div className="bg-[#FFFCF7] border border-[#7E7C77]/20 grid grid-cols-2 md:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-[#7E7C77]/20 text-center">
          {SUPPORT_QUICK_LINKS.map((item, index) => {
            const Icon = QUICK_LINK_ICONS[index] ?? MessageCircle;
            return (
            <button
              key={item.title}
              type="button"
              onClick={() => {
                const faqQuery = ['track order', 'return', 'delivery', 'size', 'payment', 'account'][index] ?? item.title;
                setQuery(faqQuery);
                faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="p-6 space-y-2 cursor-pointer hover:bg-[#6B7B6E]/5 transition-colors flex flex-col items-center justify-center"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-[#F0EBE2] text-[#526457]" aria-hidden="true"><Icon size={19} strokeWidth={1.7} /></span>
              <h4 className="text-xs font-bold text-[#2E2D2B] uppercase tracking-wider">{item.title}</h4>
              <p className="text-[11px] text-[#7E7C77]">{item.desc}</p>
            </button>
            );
          })}
        </div>
      </Container>

      <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div ref={faqRef} className="lg:col-span-7 space-y-6 scroll-mt-28">
          <div className="flex flex-col items-start gap-3 border-b border-[#7E7C77]/20 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold uppercase text-[#2E2D2B]">Frequently Asked Questions</h2>
            <button type="button" onClick={() => setQuery('')} className="text-xs font-mono text-[#7E7C77] hover:text-[#6B7B6E] underline">
              View All FAQs →
            </button>
          </div>
          {faqs.length === 0 ? (
            <p className="text-xs font-mono text-[#7E7C77]">No help topics match “{query}”.</p>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.question}
                  title={faq.question}
                  open={openQuestions.includes(faq.question)}
                  onToggle={() => toggleFaq(faq.question)}
                  className="bg-[#FFFCF7] border border-[#7E7C77]/20"
                  buttonClassName="p-5 text-left text-xs font-bold uppercase tracking-wider text-[#2E2D2B] hover:text-[#66645F]"
                  panelClassName="px-5 pb-5 text-xs text-[#7E7C77] leading-relaxed border-t border-[#7E7C77]/10 pt-3"
                  indicatorClassName="text-lg font-mono"
                >
                  {faq.answer}
                </AccordionItem>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div ref={contactRef} className="scroll-mt-28 rounded-2xl bg-[#FFFCF7] border border-[#7E7C77]/20 p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-xl font-semibold uppercase text-[#2E2D2B]">Still Need Help?</h3>
              <p className="text-xs text-[#7E7C77] mt-1">Our support team is here for you. Get in touch and we’ll respond as soon as possible.</p>
            </div>
            <ContactForm />
          </div>

          <div className="rounded-2xl bg-[#FFFCF7] border border-[#7E7C77]/20 p-6 space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#2E2D2B] border-b border-[#7E7C77]/20 pb-3">Contact Information</h3>
            <div className="space-y-4 text-xs">
              {SUPPORT_CONTACTS.map((c, i) => {
                const Icon = CONTACT_ICONS[i] ?? MessageCircle;
                return (
                <div key={c.title} className={`flex items-start gap-3 ${i > 0 ? 'border-t border-[#7E7C77]/10 pt-3' : ''}`}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F0EBE2] text-[#526457]" aria-hidden="true"><Icon size={16} strokeWidth={1.7} /></span>
                  <div>
                    <span className="font-bold text-[#2E2D2B] block">{c.title}</span>
                    <span className={c.valueClass}>{c.value}</span>
                    <p className="text-[10px] text-[#7E7C77] mt-0.5">{c.note}</p>
                  </div>
                </div>
                );
              })}
            </div>
            <div className="relative aspect-[16/9] rounded-2xl bg-[#F0EBE2] border border-[#7E7C77]/20 overflow-hidden flex flex-col justify-end p-6">
              <StoreImage src={unsplash(IMG.minimalistWardrobe, 800)} alt="" className="absolute inset-0 w-full h-full object-cover filter brightness-50" />
              <div className="relative z-10 space-y-2">
                <h4 className="text-base font-semibold uppercase text-white">Real People. Real Support.</h4>
                <p className="text-[11px] text-white/85">Our team is here to help you at every step.</p>
                <button type="button" onClick={() => { showToast('Live chat is not connected yet. Please use the contact form.'); contactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="rounded-full bg-[#526457] text-white px-4 py-2.5 font-extrabold uppercase text-[10px] tracking-[0.12em] hover:bg-[#445549]">
                  Chat Now →
                </button>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <Container className="space-y-6 pt-10">
        <h3 className="text-2xl font-semibold uppercase text-[#2E2D2B] border-b border-[#7E7C77]/20 pb-4">Popular Help Topics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {SUPPORT_TOPICS.map((topic) => (
            <button
              key={topic.title}
              type="button"
              onClick={() => {
                const topicQuery = topic.title.includes('SHIPPING') ? 'delivery' : topic.title.includes('RETURNS') ? 'return' : topic.title.includes('SIZE') ? 'size' : topic.title.includes('PAYMENT') ? 'payment' : 'track order';
                setQuery(topicQuery);
                faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="relative group flex h-[280px] flex-col justify-between overflow-hidden rounded-lg border border-[#7E7C77]/20 bg-[#F0EBE2] p-6 text-left shadow-[0_10px_30px_-10px_rgba(46,45,43,0.05)]"
            >
              <StoreImage src={topic.img} alt="" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw" className="absolute inset-0 w-full h-full object-cover filter brightness-40 group-hover:scale-105 transition-transform" />
              <span className="relative z-10 space-y-1 block">
                <span className="text-sm font-bold text-white block">{topic.title}</span>
                <span className="text-xs text-white/85 block">{topic.desc}</span>
              </span>
              <span className="relative z-10 flex justify-end">
                <span className="grid size-9 place-items-center rounded-full bg-[#FFFCF7] text-[#2E2D2B]" aria-hidden="true"><ArrowRight size={15} /></span>
              </span>
            </button>
          ))}
        </div>
      </Container>
    </div>
  );
}
