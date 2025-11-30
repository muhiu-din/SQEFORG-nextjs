"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Network, Book, Shield, Gavel, Home, Briefcase, Scale, ScrollText, Building, Users, FileText, DollarSign, Landmark, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const MIND_MAP_DATA = {
  "Contract": {
    icon: Network,
    color: "blue",
    description: "Formation, Terms, Vitiating Factors, Discharge & Remedies",
    sections: [
      {
        title: "Formation",
        topics: [
          {
            name: "Offer & Acceptance",
            keyCase: "Carlill v Carbolic Smoke Ball Co [1893]",
            principle: "Offer: clear, certain, communicated, intention to be bound. Invitation to Treat (ITT): indication of willingness to negotiate. Acceptance: unqualified assent to all terms of offer, communicated.",
            examTip: "Offer vs ITT: adverts usually ITT (Partridge v Crittenden), display of goods ITT (Pharmaceutical Society v Boots). Unilateral offer: accepted by performance (Carlill). Acceptance must be communicated (Entores v Miles Far East Corp). Postal Rule: acceptance effective when posted (Adams v Lindsell), does not apply to revocation or instantaneous communication. Revocation of offer: effective on receipt."
          },
          {
            name: "Consideration",
            keyCase: "Currie v Misa [1875]",
            principle: "Price for which promise of other is bought. Must be sufficient (have some value) but need not be adequate (equal value). Executed (act) or Executory (promise). Past consideration is no consideration.",
            examTip: "Consideration must move from promisee (but not necessarily to promisor). Past consideration: work done before promise (Re McArdle). Exception: Pao On v Lau Yiu Long (act at promisor's request, understanding of payment, promise must be enforceable if made in advance). Existing duty: performance of existing public duty no consideration (Collins v Godefroy), existing contractual duty generally no consideration (Stilk v Myrick) unless going beyond it (Hartley v Ponsonby) or practical benefit (Williams v Roffey Bros)."
          },
          {
            name: "Intention to Create Legal Relations",
            keyCase: "Balfour v Balfour [1919]",
            principle: "Presumed in commercial agreements. Presumed NOT in domestic/social agreements. Can be rebutted. Look for objective intention.",
            examTip: "Domestic/social: presumption against (Balfour - husband/wife, Jones v Padavatton - mother/daughter). Rebuttal: clear intention (Merritt v Merritt - separated couple, Simpkins v Pays - shared prize money, third party involved). Commercial: presumption FOR (Edwards v Skyways - ex gratia payment still legally binding). Rebuttal: 'honour clause' (Rose & Frank v Crompton Bros)."
          },
          {
            name: "Certainty & Completeness",
            keyCase: "Scammell v Ouston [1941]",
            principle: "Terms must be sufficiently clear and complete for courts to ascertain meaning. Agreements to agree are unenforceable. Courts strive to uphold agreements if possible.",
            examTip: "Vague terms: 'hire purchase terms' too vague (Scammell). 'Fair and reasonable price' may be certain in sale of goods (s.8 SGA 1979). Mechanism for determining term (e.g. third party valuation) can make it certain (Sudbrook Trading Estate). Severance of uncertain term if doesn't affect main purpose. Parties' past dealings can clarify."
          }
        ]
      },
      {
        title: "Terms",
        topics: [
          {
            name: "Express & Implied Terms",
            keyCase: "The Moorcock [1889] / Shirlaw v Southern Foundries [1939]",
            principle: "Express terms: specifically agreed upon. Implied terms: incorporated by custom, statute (e.g., SGA 1979), or common law (by court: in fact - 'officious bystander test' or 'business efficacy test'; in law - general rule for all contracts of certain type).",
            examTip: "Implied in fact: necessary to give contract business efficacy (The Moorcock) or so obvious 'officious bystander' would interject 'of course' (Shirlaw). Implied in law: concern type of contract (e.g., employment contracts contain implied term of mutual trust and confidence). Terms implied by statute: e.g., Sale of Goods Act 1979 (s.12-15) and Consumer Rights Act 2015 (s.9-17) imply terms as to quality, fitness for purpose, description etc."
          },
          {
            name: "Conditions, Warranties & Innominate Terms",
            keyCase: "Poussard v Spiers & Pond [1876] / Bettini v Gye [1876] / Hong Kong Fir Shipping [1962]",
            principle: "Condition: vital term, breach allows termination + damages. Warranty: minor term, breach only allows damages. Innominate term: nature depends on effect of breach (if serious = condition, if minor = warranty).",
            examTip: "Distinction is crucial for remedies. Condition: goes to root of contract (Poussard - singer missing first shows). Warranty: subsidiary to main purpose (Bettini - singer missing rehearsals). Innominate term (Hong Kong Fir): if breach deprives innocent party of substantially whole benefit, treat as condition. If not, treat as warranty. This approach gives flexibility but less certainty. Courts prefer innominate unless clear intention for condition."
          },
          {
            name: "Exclusion Clauses",
            keyCase: "Curtis v Chemical Cleaning Co [1951]",
            principle: "Must be incorporated (by signature, reasonable notice, course of dealing). Interpreted contra proferentem. Subject to Unfair Contract Terms Act 1977 (UCTA) for non-consumers and Consumer Rights Act 2015 (CRA) for consumers.",
            examTip: "Incorporation: signature binds (L'Estrange v Graucob) unless misrepresentation (Curtis). Notice must be reasonable BEFORE contract (Olley v Marlborough Court). Course of dealing must be regular/consistent (McCutcheon v MacBrayne). Contra proferentem: ambiguity resolved against party relying on clause. UCTA: cannot exclude liability for death/PI by negligence (s.2(1)). Other negligence/breach: subject to reasonableness test (s.2(2)). CRA: all unfair terms in consumer contracts are unenforceable (s.62)."
          }
        ]
      },
      {
        title: "Vitiating Factors",
        topics: [
          {
            name: "Misrepresentation",
            keyCase: "Derry v Peek [1889] / Hedley Byrne v Heller [1964]",
            principle: "False statement of fact (not opinion/future intention/law) by one party to another, which induces contract. Types: fraudulent (Derry v Peek - knowing false/reckless), negligent (Hedley Byrne - special relationship, care), innocent (Misrepresentation Act 1967 s.2(1)).",
            examTip: "Statement must be of *existing fact* (not opinion unless expertise - Esso Petroleum v Mardon). Inducement: must be material and relied upon (Attwood v Small - no reliance if check truth). Silence generally not misrepresentation (Keates v Cadogan) unless half-truth, change of circumstances, fiduciary relationship. Remedies: rescission (equitable, aims to restore original position) + damages. Bars to rescission: affirmation, lapse of time, third party rights, impossibility. Misrepresentation Act s.2(1): fiction of fraud, easier to claim damages."
          },
          {
            name: "Duress & Undue Influence",
            keyCase: "Pao On v Lau Yiu Long [1980] / Royal Bank of Scotland v Etridge (No. 2) [2001]",
            principle: "Duress: illegitimate pressure (physical or economic) leading to lack of choice, vitiates consent. Undue Influence: abuse of relationship of trust/confidence. Actual (prove pressure) or Presumed (relationship of trust, transaction not easily explainable).",
            examTip: "Duress: physical (Barton v Armstrong), economic (Atlas Express v Kafco - commercial pressure). Test for economic duress (Pao On): pressure amounted to compulsion, illegitimacy of pressure (threatened breach of contract usually illegitimate), caused contract. Undue Influence: Actual (less common, need evidence). Presumed: relationship of trust (solicitor/client, doctor/patient, parent/child - not husband/wife), transaction calls for explanation. Rebuttal: independent legal advice. Etridge: bank's duty to ensure spouse understands charge over home."
          },
          {
            name: "Mistake",
            keyCase: "Couturier v Hastie [1856] / Bell v Lever Bros [1932]",
            principle: "Mistake must be fundamental to render contract void (never existed). Common mistake (both parties make same mistake), Mutual mistake (parties at cross-purposes, no meeting of minds), Unilateral mistake (one party mistaken, other knows).",
            examTip: "Common mistake (res extincta): subject matter ceased to exist (Couturier). Common mistake (res sua): unknowingly contracting for own property. Common mistake as to quality (Bell v Lever Bros): rarely makes contract void, must be 'essentially different' (Associated Japanese Bank v Credit du Nord). Unilateral mistake: identity of other party (Cundy v Lindsay - void if identity crucial), terms of contract (Hartog v Colin & Shields - other party aware of mistake). Non est factum: not my deed (rare, signed document fundamentally different from what believed)."
          },
          {
            name: "Illegality & Public Policy",
            keyCase: "Parkinson v College of Ambulance [1925]",
            principle: "Contract prohibited by statute (express or implied) or common law (public policy). Types: contract to commit crime/tort, immoral contracts, contracts prejudicial to public service/justice, restraint of trade. Void or unenforceable.",
            examTip: "Statutory illegality: express (legislation forbids contract type) or implied (legislation penalizes conduct). Common law illegality: contracts promoting crime/tort, sexual immorality, prejudice public safety, defraud revenue, corrupt public life (Parkinson). Restraint of trade: prima facie void unless reasonable to protect legitimate interest (employer/employee, seller/buyer of business) and reasonable in scope/duration/area (Nordenfelt v Maxim Nordenfelt Guns)."
          }
        ]
      },
      {
        title: "Discharge & Remedies",
        topics: [
          {
            name: "Discharge by Performance",
            keyCase: "Cutter v Powell [1795]",
            principle: "Contract discharged when both parties fully and precisely perform obligations. Partial performance generally not enough (Cutter v Powell - strict rule). Exceptions: substantial performance, divisible contracts, prevention of performance, acceptance of part performance.",
            examTip: "Strict rule (Cutter) is harsh. Exceptions: Substantial performance (Hoenig v Isaacs): if substantial, must pay less cost to remedy defects (breach of warranty). Divisible contracts: if contract can be broken into parts, payment for completed parts. Prevention of performance (Planché v Colburn): if one party prevents other, other can claim quantum meruit. Acceptance of part performance: if innocent party freely accepts, must pay quantum meruit. Tender of performance: willingness to perform, refusal means discharge."
          },
          {
            name: "Discharge by Breach",
            keyCase: "Hochster v De La Tour [1853]",
            principle: "Breach of condition allows innocent party to terminate and claim damages. Breach of warranty only allows damages. Anticipatory breach: one party indicates before performance due they will not perform (Hochster v De La Tour).",
            examTip: "Breach can be actual (at time of performance) or anticipatory. Anticipatory: innocent party can accept breach (terminate + claim damages immediately) or affirm contract (wait for performance, but if event supervenes may lose right to damages - Avery v Bowden). Repudiatory breach: breach of condition or serious breach of innominate term. Innocent party has choice: affirm or terminate. Affirmation (express or implied) means contract continues."
          },
          {
            name: "Discharge by Frustration",
            keyCase: "Taylor v Caldwell [1863] / Krell v Henry [1903]",
            principle: "Unforeseen event makes performance impossible, illegal, or radically different from what was contemplated, without fault of either party. Contract automatically terminated. Not self-induced, not just more onerous.",
            examTip: "Key: unforeseen, radically different, no fault. Examples: destruction of subject matter (Taylor v Caldwell - music hall burnt), non-occurrence of fundamental event (Krell v Henry - coronation cancelled), supervening illegality, death/incapacity (personal service contracts). NOT frustration if: self-induced (Maritime National Fish v Ocean Trawlers), event foreseen/provided for, merely more expensive/difficult (Davis Contractors v Fareham UDC). Effects: Law Reform (Frustrated Contracts) Act 1943 - money paid recoverable, money payable ceases, compensation for valuable benefit."
          },
          {
            name: "Remedies - Damages",
            keyCase: "Hadley v Baxendale [1854]",
            principle: "Damages aim to put innocent party in position as if contract performed (expectation loss). Remoteness: damages recoverable if arise naturally from breach (first limb) or in contemplation of parties at time of contract (second limb - Hadley v Baxendale). Mitigation: innocent party must take reasonable steps to minimize loss.",
            examTip: "Losses recoverable: expectation loss (loss of profit), reliance loss (expenditure), sometimes non-pecuniary loss (mental distress if contract's object was pleasure/relaxation - Jarvis v Swans Tours). Causation: 'but for' test. Remoteness: foreseeability. Mitigation: reasonable steps, cannot recover for losses could have avoided. Liquidated damages clause: genuine pre-estimate of loss, enforceable. Penalty clause: extravagant/unconscionable, unenforceable."
          },
          {
            name: "Remedies - Equitable",
            keyCase: "Lumley v Wagner [1852]",
            principle: "Discretionary remedies: Specific Performance (order to perform contract) or Injunction (order to do/not do something). Not awarded if damages adequate, constant supervision needed, personal service contracts, or if claimant has unclean hands.",
            examTip: "Specific performance: usually for unique goods (land, rare chattels). Not for personal service (slavery). Injunction: prohibitory (stop doing) or mandatory (make do). Lumley v Wagner: injunction to stop singer performing elsewhere (not order to sing). Both remedies are discretionary: factors like delay, hardship, clean hands affect outcome. Quantum meruit: 'as much as deserved', payment for work done when no fixed price or contract breached/frustrated."
          }
        ]
      }
    ]
  },
  "Tort": {
    icon: Shield,
    color: "green",
    description: "Negligence, Trespass, Nuisance, Defamation & Vicarious Liability",
    sections: [
      {
        title: "Negligence",
        topics: [
          {
            name: "Duty of Care",
            keyCase: "Donoghue v Stevenson [1932] / Caparo Industries v Dickman [1990]",
            principle: "Lord Atkin's neighbour principle (Donoghue). Modern 3-part test (Caparo): (1) foreseeability of harm, (2) proximity of relationship, (3) fair, just and reasonable to impose duty. Established categories have duty.",
            examTip: "Established duties: road users, doctor-patient, employer-employee. Novel situations: apply Caparo. Foreseeability: reasonable person test. Proximity: close relationship (physical, temporal, relational). Fair, just, reasonable: policy considerations, floodgates, defensive practice. Pure economic loss: generally no duty (Spartan Steel), unless Hedley Byrne (special relationship, negligent misstatement). Omissions: generally no duty to act (Smith v Littlewoods), unless special relationship or control of source of danger."
          },
          {
            name: "Breach of Duty",
            keyCase: "Blyth v Birmingham Waterworks [1856]",
            principle: "Failure to meet standard of care. Standard is that of a 'reasonable person'. Objective test. Factors: probability of harm, seriousness of harm, cost of precautions, social utility of activity, common practice.",
            examTip: "Reasonable person: 'man on Clapham omnibus'. Not too clever, not too stupid. Professional: standard of ordinary skilled member of that profession (Bolam test). Learner driver: standard of experienced driver (Nettleship v Weston). Child: standard of reasonable child of same age. Factors: Bolton v Stone (low probability, no breach), Paris v Stepney Borough Council (high seriousness for claimant, breach), Latimer v AEC (high cost of precautions, no breach), Watt v Hertfordshire CC (high social utility, no breach). Res ipsa loquitur: 'the thing speaks for itself' (Scott v London & St Katherine Docks) - burden of proof shifts to defendant."
          },
          {
            name: "Causation & Remoteness",
            keyCase: "Barnett v Chelsea and Kensington Hospital [1969] / Wagon Mound (No. 1) [1961]",
            principle: "Causation in fact ('but for' test - Barnett). Causation in law (remoteness): harm must be of a foreseeable type (Wagon Mound). Intervening acts (novus actus interveniens) can break chain of causation.",
            examTip: "'But for' test: would claimant have suffered harm 'but for' defendant's breach? (Barnett - no, so no causation). Multiple causes: material contribution test (Bonnington Castings), material increase in risk (McGhee v NCB). Remoteness: type of harm must be foreseeable, not exact manner or extent (Hughes v Lord Advocate - foreseeable burn, not foreseeable explosion). Thin skull rule: 'take your victim as you find him' (Smith v Leech Brain) - if type of harm foreseeable, full extent recoverable. Intervening acts: claimant's own unreasonable act, third party's act, natural event."
          },
          {
            name: "Defences to Negligence",
            keyCase: "Sayers v Harlow UDC [1958] / Dann v Hamilton [1939]",
            principle: "Contributory negligence (Law Reform (Contributory Negligence) Act 1945): claimant partially at fault, damages reduced. Volenti non fit injuria: claimant voluntarily assumed risk, full defence (rare). Exclusion clauses (UCTA 1977, CRA 2015).",
            examTip: "Contributory negligence: claimant contributed to own injury (Sayers - getting out of cubicle). Judge apportions blame. Volenti: claimant fully consented to both risk and damage (Dann - knew driver drunk, but didn't consent to negligent driving). Requires full knowledge + voluntary acceptance. Rare for road accidents (s.149 Road Traffic Act 1988). Ex turpi causa (illegality): if claimant engaged in criminal act (Gray v Thames Trains - damages for loss of earnings from criminal act not allowed)."
          }
        ]
      },
      {
        title: "Trespass to Person",
        topics: [
          {
            name: "Battery",
            keyCase: "Collins v Wilcock [1984]",
            principle: "Intentional direct application of unlawful force to another person. Force can be minimal. No need for hostile intent. Defence: consent, self-defence, necessity.",
            examTip: "Intentional: direct act, not necessarily hostile (Collins - police grabbing arm). Direct: immediate consequence of D's act. Unlawful force: any physical contact beyond ordinary social interaction. Consent: express or implied (e.g. contact sports, busy street). Self-defence: reasonable force in self-defence (Ashley v CC Sussex Police). Necessity: to prevent greater harm."
          },
          {
            name: "Assault",
            keyCase: "Stephens v Myers [1830]",
            principle: "Intentionally causing another to apprehend immediate and unlawful force. No physical contact required. Mere words can be assault (R v Ireland).",
            examTip: "Apprehension: victim must reasonably believe they are about to be touched. Immediacy: force must be imminent. Conditional threat can be assault if threat itself is unlawful (Read v Coker). Words alone can be assault (R v Ireland)."
          },
          {
            name: "False Imprisonment",
            keyCase: "Bird v Jones [1845] / R v Governor of Brockhill Prison ex p Evans (No 2) [2001]",
            principle: "Intentional total restraint of claimant's liberty without lawful justification. Can be physical or psychological. No need for claimant to know they are restrained at the time (Meering v Grahame-White Aviation).",
            examTip: "Total restraint: no reasonable means of escape (Bird v Jones). Partial obstruction not enough. Can be by words (command to stay) or physical. Unlawful: without legal authority. Lack of awareness: doesn't defeat claim (Meering). Lawful arrest is a defence if criteria met."
          }
        ]
      },
      {
        title: "Trespass to Land & Chattels",
        topics: [
          {
            name: "Trespass to Land",
            keyCase: "Entick v Carrington [1765]",
            principle: "Intentional direct interference with claimant's possession of land without lawful justification. Entry can be personal, by object, or remaining on land. No need for damage.",
            examTip: "Possession: claimant must be in possession (tenant, not landlord during tenancy). Direct: immediate result of D's act. Intentional: voluntary act, mistake no defence. Interference: walking on land, placing objects, remaining after permission withdrawn. Airspace (limited by ordinary use - Kelsen v Imperial Tobacco) and subsoil (Star Energy v Bocardo). Defences: consent/licence, necessity, legal authority."
          },
          {
            name: "Trespass to Chattels",
            keyCase: "Fouldes v Willoughby [1841]",
            principle: "Intentional direct interference with claimant's possession of chattel. No damage required. Examples: moving, touching, damaging. Actionable per se (without proof of damage).",
            examTip: "Possession: claimant must have possession. Direct: immediate result. Intentional: voluntary act. Includes damaging, destroying, using, removing (Kirk v Gregory - moving ring). Conversion: more serious interference, treating goods as if they were your own (Fouldes v Willoughby - moving horses not conversion, but sale would be). Detinue: wrongful refusal to return goods. Remedies: damages, injunction, return of goods."
          }
        ]
      },
      {
        title: "Nuisance & Rylands v Fletcher",
        topics: [
          {
            name: "Private Nuisance",
            keyCase: "Hunter v Canary Wharf Ltd [1997]",
            principle: "Unlawful interference with a person's use or enjoyment of land, or with rights over it. Requires claimant to have interest in land. Factors: locality, duration, sensitivity, malice, public benefit.",
            examTip: "Unlawful interference: substantial, unreasonable interference. Not 'unlawful' in criminal sense. Claimants: must have interest in land (Hunter). Locality: 'what would be a nuisance in Belgrave Square would not necessarily be so in Bermondsey' (Sturges v Bridgman). Duration: usually continuous (but single event can be - Crown River Cruises v Kimbolton Fireworks). Sensitivity: abnormally sensitive claimant cannot claim if reasonable person unaffected (Robinson v Kilmpton). Malice: can turn reasonable act into nuisance (Christie v Davey). Defences: prescription (20 years), statutory authority. Not: coming to nuisance."
          },
          {
            name: "Public Nuisance",
            keyCase: "Attorney General v PYA Quarries [1957]",
            principle: "Act or omission which materially affects the reasonable comfort and convenience of a class of Her Majesty's subjects. Requires special damage by claimant to sue individually. Usually prosecuted by Attorney General.",
            examTip: "Class of subjects: sufficient number of people affected (PYA Quarries). Special damage: claimant must suffer damage over and above that suffered by general public. Examples: obstructing highway, fumes, noise. Remedy: injunction (AG), damages (individual)."
          },
          {
            name: "Rule in Rylands v Fletcher",
            keyCase: "Rylands v Fletcher [1868]",
            principle: "Strict liability for escape of dangerous thing from land where it was accumulated in a non-natural user of land, causing damage. Claimants need not have interest in land (Transco plc v Stockport MBC).",
            examTip: "Elements: (1) defendant brings onto land, (2) something likely to do mischief if it escapes, (3) which escapes, (4) causing damage, (5) non-natural use of land. Non-natural use: 'extraordinary and unusual' (Rickards v Lothian) - not just ordinary domestic use. Dangerous thing: water, gas, electricity, chemicals. Defences: act of God, act of stranger, statutory authority, consent of claimant, contributory negligence. Transco: limited rule to 'exceptional risk' not ordinary domestic/commercial use."
          }
        ]
      },
      {
        title: "Defamation",
        topics: [
          {
            name: "Libel & Slander",
            keyCase: "Defamation Act 2013",
            principle: "Libel: permanent form (writing, broadcast). Slander: transient form (spoken word). Libel actionable per se. Slander requires proof of special damage (pecuniary loss) unless exceptions apply (e.g. imputation of crime, disease, unchastity, unfitness for profession).",
            examTip: "Defamation Act 2013: removed presumption of jury trial, introduced serious harm test (s.1). Serious harm: statements must cause or be likely to cause serious harm to reputation. For bodies trading for profit, serious financial loss required. Libel is permanent (writing, pictures, films, broadcasts). Slander is transient. Exceptions for slander per se mean special damage not needed."
          },
          {
            name: "Elements of Defamation",
            keyCase: "Jameel v Dow Jones Inc [2005]",
            principle: "Statement must (1) be defamatory, (2) refer to the claimant, (3) be published to a third party. Defamatory: lowers claimant in estimation of right-thinking members of society (Sim v Stretch).",
            examTip: "Defamatory meaning: objective test, can be literal or innuendo. Reference to claimant: need not name, enough that reasonable person would identify. Group defamation: if group is small, specific individuals may be identified. Publication: to at least one person other than claimant. Serious harm (s.1 Defamation Act 2013): must show serious harm to reputation, or for body trading for profit, serious financial loss."
          },
          {
            name: "Defences to Defamation",
            keyCase: "Reynolds v Times Newspapers Ltd [1999]",
            principle: "Truth (justification): statement is substantially true (s.2 DA 2013). Honest Opinion (fair comment): statement of opinion, indicated as such, based on existing facts, could an honest person hold it (s.3 DA 2013). Absolute privilege (parliament, court). Qualified privilege (s.4 DA 2013 'publication on matter of public interest', Reynolds privilege).",
            examTip: "Truth: complete defence if can prove. Honest Opinion: no need to prove it's true, just that it's an honest opinion. Absolute privilege: protects freedom of speech in vital public functions (parliamentary proceedings, judicial proceedings). Qualified privilege: protects communication where duty to publish and interest to receive. Reynolds privilege (now s.4 DA 2013): responsible journalism on matters of public interest. Consent, offer of amends, innocent dissemination also defences."
          }
        ]
      },
      {
        title: "Vicarious Liability",
        topics: [
          {
            name: "Elements of Vicarious Liability",
            keyCase: "Cox v Ministry of Justice [2017] / Various Claimants v Catholic Child Welfare Society [2012]",
            principle: "Employer held liable for torts committed by employee in course of employment. Three elements: (1) tort committed, (2) tortfeasor is employee (or relationship akin to employment), (3) tort committed in course of employment.",
            examTip: "Relationship: traditional employee (control test, integration test, multiple test). Akin to employment (Cox, CCWS): sufficient control by D over tortfeasor, tortfeasor carrying out activity for D's benefit, integral to D's business. Course of employment: close connection test (Lister v Hesley Hall). Not: 'frolic of his own' (Joel v Morrison). Intentional torts (Mohamud v Wm Morrison Supermarkets - close connection between job and assault)."
          }
        ]
      }
    ]
  },
  "Criminal": {
    icon: Gavel,
    color: "red",
    description: "Actus Reus, Mens Rea, Homicide, Non-Fatal Offences & Defences",
    sections: [
      {
        title: "General Principles",
        topics: [
          {
            name: "Actus Reus",
            keyCase: "R v Pittwood [1902] / R v Dytham [1979]",
            principle: "The 'guilty act'. Must be voluntary. Can be an act or an omission (failure to act) if there is a duty to act. Result crimes require causation. State of affairs crimes require no act.",
            examTip: "Voluntary act: if involuntary (e.g., reflex, spasm, external force), no AR. Omissions: generally no liability (e.g., no duty to rescue). Exceptions (duty to act): contractual (Pittwood), public office (Dytham), relationship (parent/child), voluntarily assumed care (Stone & Dobinson), creation of dangerous situation (Miller). Causation: factual ('but for' test) and legal (operating and substantial cause, no novus actus interveniens). State of affairs: e.g., being found drunk in charge of a vehicle."
          },
          {
            name: "Mens Rea",
            keyCase: "R v Moloney [1985] / R v Cunningham [1957]",
            principle: "The 'guilty mind'. Intention: direct (aim/purpose) or indirect/oblique (foresight of virtual certainty - Woollin). Recklessness: D foresees risk and unreasonably takes it (Cunningham). Negligence: D falls below standard of reasonable person.",
            examTip: "Intention: Moloney - direct intention is straight-forward. Oblique intention (Woollin): jury may find intention if D foresaw death/GBH as virtual certainty AND jury finds it was virtually certain. Recklessness (Cunningham): subjective (D must actually foresee). Negligence: objective (how would reasonable person behave). Transferred malice: MR for one crime can transfer to AR of same crime against different victim (Latimer). Coincidence of AR and MR: must happen at same time (Thabo Meli)."
          },
          {
            name: "Strict Liability",
            keyCase: "Sweet v Parsley [1970]",
            principle: "Offences where no mens rea is required for at least one element of the actus reus. Usually regulatory offences. Defence of honest and reasonable mistake not available. Courts presume mens rea is required unless clear intention otherwise (Sweet v Parsley).",
            examTip: "Identifying strict liability: look at statute (wording). Presumption of MR: if statute silent, courts presume MR unless: (1) social concern/public welfare, (2) penalty is small, (3) offence truly regulatory. Defence of due diligence/reasonable care sometimes available (e.g., food safety). Examples: pollution, traffic offences, selling alcohol to minors."
          },
          {
            name: "Parties to Crime",
            keyCase: "Jogee [2016]",
            principle: "Principal offender: commits the AR and MR. Secondary party (accomplice): aids, abets, counsels, or procures commission of offence. Must intend to assist/encourage, and know the type of offence. Joint enterprise now requires intention, not just foresight.",
            examTip: "Aiding: assisting at time. Abetting: encouraging at time. Counselling: advising/soliciting beforehand. Procuring: causing to happen. Need MR for principal's offence, and MR for aiding/abetting. Knowledge of type of offence sufficient (not exact details). Jogee: removed foresight as basis for joint enterprise; now requires secondary party to intend to assist/encourage with foresight. Mere presence not enough."
          }
        ]
      },
      {
        title: "Homicide",
        topics: [
          {
            name: "Murder",
            keyCase: "R v Vickers [1957]",
            principle: "Unlawful killing of a human being under the Queen's Peace with malice aforethought (intention to kill or cause grievous bodily harm - GBH). Mandatory life sentence.",
            examTip: "Unlawful killing: no defence (e.g., self-defence). Human being: born alive (A-G's Ref No.3 of 1994). Under Queen's Peace: not in war. Malice aforethought: MR for murder (Vickers). GBH = really serious harm (DPP v Smith). Direct or oblique intention (Woollin). Causation must be established. All partial defences reduce to voluntary manslaughter."
          },
          {
            name: "Voluntary Manslaughter (Partial Defences)",
            keyCase: "Coroners and Justice Act 2009",
            principle: "Reduces murder to manslaughter. Loss of Control (s.54): qualifying trigger (fear of serious violence or things said/done), normal person might have acted same. Diminished Responsibility (s.52): abnormality of mental functioning, substantial impairment, explanation for killing.",
            examTip: "Loss of Control: objective + subjective. Qualifying triggers: (1) fear of serious violence, (2) things said/done of extremely grave character, caused D to have justified sense of being seriously wronged. Not revenge. Diminished Responsibility: medical condition (recognized), impairs mental ability (understand conduct, form rational judgment, exercise self-control), explains killing. Burden of proof on defence (balance of probabilities). Intoxication usually no defence unless caused mental disorder or involuntary. Suicide Pact (Homicide Act 1957 s.4) also a partial defence."
          },
          {
            name: "Involuntary Manslaughter",
            keyCase: "R v Adomako [1995] / R v Lamb [1967]",
            principle: "Unlawful killing without malice aforethought. Types: (1) Unlawful Act Manslaughter (UAM): D commits unlawful, dangerous act, causes death. (2) Gross Negligence Manslaughter (GNM): D's extremely negligent act causes death, high risk of death.",
            examTip: "UAM (Lamb): unlawful act (base crime, not just omission), objectively dangerous (Church - reasonable person would foresee some harm), caused death. D need not foresee death. GNM (Adomako): D owed duty of care, breached duty, breach caused death, breach was 'grossly' negligent (so bad as to be criminal), high risk of death (Rose). Both require causation. Subject to the full range of defences (not just partial)."
          }
        ]
      },
      {
        title: "Non-Fatal Offences Against the Person",
        topics: [
          {
            name: "Assault & Battery (Common Assault)",
            keyCase: "Collins v Wilcock [1984] / Fagan v MPC [1969]",
            principle: "Assault: causing apprehension of immediate unlawful force. Battery: application of immediate unlawful force. Summary offences. Can be committed recklessly.",
            examTip: "Assault: no touching needed (R v Ireland - words alone). Battery: any touching, even minimal, without consent (Collins). MR for both: intention OR Cunningham recklessness. Continuous act: if AR and MR don't coincide, look for continuous act (Fagan). Offences against the Person Act 1861 doesn't define assault/battery."
          },
          {
            name: "ABH (s.47 OAPA 1861)",
            keyCase: "R v Miller [1954]",
            principle: "Assault or battery occasioning Actual Bodily Harm. Requires assault/battery, ABH (any hurt or injury calculated to interfere with health or comfort), and causation. MR is for assault/battery only (no intent for ABH needed).",
            examTip: "ABH: includes psychiatric injury (R v Chan-Fook) if more than mere emotions. Not necessarily permanent or serious (T v DPP - momentary loss of consciousness). MR is only for the assault/battery (Roberts - no need to foresee ABH). Example: push (battery) causes person to fall and break arm (ABH). Max 5 years imprisonment."
          },
          {
            name: "GBH (s.20 OAPA 1861)",
            keyCase: "DPP v Smith [1961] / R v Mowatt [1968]",
            principle: "Unlawfully and maliciously wounding or inflicting GBH. MR: intention OR recklessness as to causing SOME harm (Mowatt). Malice here means 'intention or recklessness'. Wound: break in both layers of skin.",
            examTip: "Wound: internal bleeding not enough (Eisenhower). GBH: really serious harm (Smith). Inflict: no need for assault/battery (Burstow). MR: intention to cause *some* harm OR recklessness as to *some* harm (Mowatt). No need to foresee GBH, just some harm. Max 5 years imprisonment. Less serious MR than s.18."
          },
          {
            name: "GBH with Intent (s.18 OAPA 1861)",
            keyCase: "R v Taylor [2009]",
            principle: "Unlawfully and maliciously wounding or causing GBH with specific intent to cause GBH OR intent to resist/prevent lawful arrest. Higher MR than s.20.",
            examTip: "MR for s.18: specific intent to cause GBH or resist/prevent lawful arrest (Taylor). Recklessness is NOT enough. If intent to cause GBH, then GBH must be caused (or wounding). If intent to resist arrest, can be any harm. Max life imprisonment. This is the most serious non-fatal offence."
          }
        ]
      },
      {
        title: "Theft & Fraud",
        topics: [
          {
            name: "Theft (Theft Act 1968 s.1)",
            keyCase: "R v Morris [1984] / R v Ghosh [1989] / Ivey v Genting Casinos [2017]",
            principle: "Dishonestly appropriating property belonging to another with intention to permanently deprive. AR: appropriation, property, belonging to another. MR: dishonesty, intention to permanently deprive.",
            examTip: "Appropriation: assuming rights of owner (Morris). Can be by consent (Gomez). Property: money, real property (limited exceptions), personal property, things in action, intangible property. Belonging to another: possession or control (Turner No.2 - can steal own car). Dishonesty (Ivey v Genting Casinos - objective test: was D's conduct dishonest by standards of ordinary people?). ITPD: treat property as own to dispose of regardless of other's rights (DPP v Lavender)."
          },
          {
            name: "Robbery (Theft Act 1968 s.8)",
            keyCase: "R v Dawson [1976]",
            principle: "Theft, where force or threat of force is used 'immediately before or at the time of' the theft and 'in order to' steal. Force can be minimal (Dawson).",
            examTip: "Robbery = theft + force. Force: any force. Immediacy: must be close in time. In order to steal: force used for purpose of theft. Max life imprisonment. MR for theft + MR for force."
          },
          {
            name: "Burglary (Theft Act 1968 s.9)",
            keyCase: "R v Ryan [1976]",
            principle: "Entering a building or part of a building as a trespasser with intent to commit theft, GBH, or criminal damage (s.9(1)(a)), OR having entered as a trespasser, committing theft or GBH (s.9(1)(b)).",
            examTip: "Building: includes inhabited vehicle/vessel. Part of a building: e.g., behind a counter in a shop. Trespasser: without permission. Entry: effective entry, not necessarily substantial (Ryan - head/arm in window). For s.9(1)(a), MR for trespass + intent for target offence at time of entry. For s.9(1)(b), MR for trespass + AR/MR for theft/GBH after entry."
          },
          {
            name: "Fraud (Fraud Act 2006)",
            keyCase: "Fraud Act 2006",
            principle: "Single offence of fraud, can be committed in 3 ways: (1) False representation, (2) Failing to disclose information, (3) Abuse of position. AR: false representation/failure/abuse. MR: dishonesty, intention to make gain/cause loss/expose to risk of loss.",
            examTip: "False representation: can be express or implied, as to fact/law/state of mind. Dishonesty (Ivey test). Intention: actual intention to gain/loss, no need for actual gain/loss. Gain/loss: includes temporary, money, property, services. Abuse of position: D occupies position where expected to safeguard financial interests of another and dishonestly abuses that position."
          }
        ]
      },
      {
        title: "General Defences",
        topics: [
          {
            name: "Self-Defence & Prevention of Crime",
            keyCase: "R v Palmer [1971] / Criminal Justice and Immigration Act 2008 s.76",
            principle: "Reasonable force used in self-defence (s.76 CJIA 2008). Subjective test for necessity of force, objective test for reasonableness of force. Defence of property/another also covered.",
            examTip: "Necessity: D honestly believes force needed. Reasonableness: degree of force used proportionate. Pre-emptive strike OK. Mistake: if honest mistake, OK even if unreasonable mistake for self-defence. Householder cases (s.76(5A)): force used is not to be regarded as reasonable if it was grossly disproportionate, but can be disproportionate. Retreat not necessary. All or nothing defence (acquittal if successful)."
          },
          {
            name: "Insanity & Automatism",
            keyCase: "M'Naghten Rules [1843] / R v Quick [1973]",
            principle: "Insanity (M'Naghten Rules): disease of mind, caused defect of reason, D did not know nature/quality of act or that it was wrong. Automatism: D performs involuntary act due to external factor. No MR/AR. D's act totally involuntary.",
            examTip: "Insanity: legal not medical. 'Disease of mind' can be physical too (epilepsy, diabetes affecting brain). Verdict: not guilty by reason of insanity (leads to detention). Automatism: external cause (blow to head, medication, hypnosis). If self-induced (e.g., through intoxication) generally no defence. If internal cause = insanity. If D knows condition and doesn't take precautions, may be reckless. Diabetes: if too much insulin (external) = automatism, if too little (internal) = insanity (Hennessey)."
          },
          {
            name: "Intoxication",
            keyCase: "DPP v Majewski [1977]",
            principle: "Voluntary intoxication: defence to specific intent crimes IF D lacked necessary MR. No defence to basic intent crimes. Involuntary intoxication: defence if D lacked MR AND would not have formed it if sober.",
            examTip: "Specific intent crimes: murder, s.18 GBH, theft, robbery, burglary. Basic intent crimes: manslaughter, s.20 GBH, assault, battery. Majewski rule: for basic intent crimes, becoming voluntarily intoxicated is itself a reckless act, so provides MR. Involuntary intoxication: 'spiked' drink, prescribed medication (but only if unexpected effect). If D forms MR despite intoxication, still guilty."
          },
          {
            name: "Duress",
            keyCase: "R v Graham [1982] / R v Hasan [2005]",
            principle: "Threat of death or serious injury to D or someone for whom D is responsible. Two-stage test (Graham): (1) D reasonably believed threat, (2) reasonable person would have succumbed. No defence to murder or attempted murder (Howe). Not available if self-induced.",
            examTip: "Threat must be specific, imminent, unavoidable (cannot run to police). Threat to property insufficient. Not available for murder, attempted murder (Howe), treason. Self-induced duress (Hasan): if voluntarily associated with criminals, defence may be lost. Marital coercion: abolished. Duress of circumstances: similar to duress by threats but from circumstances rather than specific person."
          }
        ]
      }
    ]
  },
  "Land": {
    icon: Home,
    color: "orange",
    description: "Estates, Interests, Registration, Co-ownership & Leases",
    sections: [
      {
        title: "Estates & Interests in Land",
        topics: [
          {
            name: "Estates in Land",
            keyCase: "Law of Property Act 1925 (LPA 1925)",
            principle: "Legal estates (s.1 LPA 1925): Freehold (fee simple absolute in possession) and Leasehold (term of years absolute). Only these can exist as legal estates. All other estates are equitable.",
            examTip: "Freehold: largest estate, lasts forever, full ownership. Leasehold: for a fixed period (term of years). Both give right to possess the land. LPA 1925 aimed to simplify land ownership by reducing legal estates to two. All others (e.g. life estate, entailed interest) exist only in equity, operating behind a trust."
          },
          {
            name: "Interests in Land",
            keyCase: "Law of Property Act 1925 (LPA 1925)",
            principle: "Legal interests (s.1(2) LPA 1925): easements, rentcharges, charges by way of legal mortgage, rights of entry. Must be held for equivalent to a fee simple or term of years. All other interests are equitable (s.1(3) LPA 1925).",
            examTip: "Easement: right to use another's land (e.g., right of way). Mortgage: security for a loan. Equitable interests: include restrictive covenants, estate contracts (option to purchase, right of pre-emption), beneficial interests under a trust. Equitable interests are often subject to different rules regarding enforceability against third parties."
          },
          {
            name: "Creation of Legal & Equitable Interests",
            keyCase: "LPA 1925 / Law of Property (Miscellaneous Provisions) Act 1989 (LP(MP)A 1989)",
            principle: "Legal estates/interests (s.52 LPA 1925): generally require a deed (s.1 LP(MP)A 1989) and registration (LRA 2002) to be legal. Equitable interests: often created in writing (s.53(1)(a) LPA 1925) or by a specifically enforceable contract (s.2 LP(MP)A 1989).",
            examTip: "Deed requirements (s.1 LP(MP)A 1989): clear on face intended to be a deed, validly executed (signed, witnessed, delivered). Failure to use a deed usually means the interest takes effect in equity (Walsh v Lonsdale - 'equity looks on as done that which ought to be done'). Resulting/constructive trusts (s.53(2) LPA 1925) do not require writing."
          }
        ]
      },
      {
        title: "Land Registration",
        topics: [
          {
            name: "Registered vs Unregistered Land",
            keyCase: "Land Registration Act 2002 (LRA 2002)",
            principle: "Registered land: ownership and most interests recorded on a central register. Unregistered land: ownership proved by title deeds. LRA 2002 aims to move all land to registered system ('crack the register').",
            examTip: "Registered land provides clarity, security, simplifies conveyancing. Unregistered land relies on chain of title deeds, more complex and risky. Compulsory registration events (e.g., sale, long lease, mortgage) trigger first registration. Over time, most land has become registered. Key distinction: how interests are protected and their enforceability against purchasers."
          },
          {
            name: "Registrable Dispositions",
            keyCase: "LRA 2002 s.27",
            principle: "Certain dispositions of a registered estate must be completed by registration to take effect at law (s.27 LRA 2002). E.g., transfer of freehold, grant of lease for more than 7 years, grant of legal mortgage, grant of legal easement.",
            examTip: "If a registrable disposition is not registered, it cannot take effect at law and remains an equitable interest (s.27(1)). This is a crucial point for purchasers. Failure to register means the interest is not legal and may not bind a purchaser. The 'register is everything' principle."
          },
          {
            name: "Protection of Interests (Notices & Restrictions)",
            keyCase: "LRA 2002 ss.32, 40",
            principle: "Minor interests in registered land (most equitable interests) protected by entry of a Notice (s.32) or a Restriction (s.40) on the register. Failure to register by Notice means the interest will not bind a purchaser for valuable consideration (s.29).",
            examTip: "Notice: records existence of an interest (e.g., restrictive covenant, estate contract, equitable easement). Restriction: limits registered proprietor's ability to deal with land (e.g., to ensure overreaching occurs for beneficial interests under a trust). Crucial for enforceability against third parties. 'Minor interests' refers to those that are not overriding and not registrable dispositions."
          },
          {
            name: "Overriding Interests",
            keyCase: "LRA 2002 Schedule 3",
            principle: "Interests which bind a purchaser of registered land even though they do not appear on the register. Examples: lease for 7 years or less, interests of persons in actual occupation, legal easements (if certain conditions met).",
            examTip: "These are 'cracks in the mirror' of the register. Purchasers must be aware of them. Actual occupation (Sch 3 para 2): must be 'physical presence', not merely an intention (Abbey National v Cann). Occupier's interest must be proprietary (National Provincial Bank v Ainsworth). Discoverable on reasonable inspection (unless purchaser failed to inquire, or occupier failed to disclose). Overreaching (s.2 & s.27 LPA 1925) can occur where beneficial interests under a trust are overreached by payment to at least two trustees."
          }
        ]
      },
      {
        title: "Co-ownership",
        topics: [
          {
            name: "Joint Tenancy vs Tenancy in Common",
            keyCase: "LPA 1925 s.34, 36",
            principle: "Two forms of co-ownership at law (joint tenancy only for legal title - s.34(2) LPA 1925) and equity. Joint tenancy: four unities (possession, interest, title, time), right of survivorship. Tenancy in common: unity of possession only, no right of survivorship (share passes by will/intestacy).",
            examTip: "Legal title MUST be held as joint tenants (s.36(2) LPA 1925). Equitable title can be JT or TiC. Presumption of TiC in equity if: unequal contributions, business partners, loan on mortgage. Words of severance ('in equal shares') create TiC. Right of survivorship: on death of JT, interest passes to surviving JTs, not by will. TiC can leave share to anyone. Max 4 legal owners."
          },
          {
            name: "Severance of Joint Tenancy",
            keyCase: "Law of Property Act 1925 s.36(2) / Williams v Hensman [1861]",
            principle: "Process by which a joint tenancy in equity is converted into a tenancy in common. Methods: (1) written notice (s.36(2) LPA 1925), (2) alienation (sale, mortgage), (3) mutual agreement, (4) mutual course of dealing, (5) homicide.",
            examTip: "Written notice: unilateral, effective when received (Kinch v Bullard). Must be clear intention to sever immediately. Alienation: selling share, mortgaging share (creates TiC of mortgagor's share). Mutual agreement: all JTs agree to sever. Mutual course of dealing: conduct indicating common intention to sever (Burgess v Rawnsley). Homicide: killer cannot benefit from survivorship. Severance only affects equitable title, legal title remains JT. Only effects the severing JT's share."
          },
          {
            name: "Trusts of Land and Appointment of Trustees Act 1996 (TLATA)",
            keyCase: "TLATA 1996",
            principle: "Replaced 'trusts for sale' with 'trusts of land'. Gives trustees (legal owners) powers of absolute owner, but must act in beneficiaries' best interests. Beneficiaries (equitable owners) have rights of occupation (s.12) and to be consulted (s.11).",
            examTip: "TLATA aims to give more weight to beneficial interests. Trustees can postpone sale. Beneficiaries in occupation have right to occupy unless unsuitable. Court can order sale (s.14 application) considering factors: intention of creators, purpose, welfare of minors, interests of secured creditors. Focus is on purpose for which land is held (e.g., family home)."
          },
          {
            name: "Disputes over Co-owned Land (TLATA s.14)",
            keyCase: "TLATA 1996 s.14",
            principle: "Any person with an interest in land subject to a trust of land can apply to court for an order (e.g., for sale, partition). Court considers factors in s.15 TLATA (e.g., intentions of parties, purpose of property, welfare of minors, creditors).",
            examTip: "S.15 factors: (a) intentions of persons who created trust, (b) purposes for which property is held, (c) welfare of any minor occupying, (d) interests of any secured creditor. For bankruptcy cases, s.335A Insolvency Act 1986 applies (creditor's interests paramount after 1 year, unless exceptional circumstances). The court has wide discretion to make orders it thinks just and reasonable."
          }
        ]
      },
      {
        title: "Leases",
        topics: [
          {
            name: "Characteristics of a Lease",
            keyCase: "Street v Mountford [1985]",
            principle: "Key elements (Street v Mountford): (1) Exclusive Possession, (2) For a Term Certain, (3) At a Rent (though not strictly essential after Ashburn Anstalt). Without these, it's a licence (personal right).",
            examTip: "Exclusive possession: ability to exclude all others, including landlord (except for limited entry rights like repairs). Term certain: fixed maximum duration (Lace v Chantler - 'for duration of war' not certain). Rent: not strictly necessary for a lease (s.205(1)(xxvii) LPA 1925). Sham clauses (e.g., 'no exclusive possession', 'licence') are disregarded if substance is lease (Street v Mountford)."
          },
          {
            name: "Types of Lease & Formalities",
            keyCase: "LPA 1925 / LP(MP)A 1989 / LRA 2002",
            principle: "Legal leases: generally require a deed (s.52 LPA 1925) and registration if over 7 years (s.27 LRA 2002). Exception for leases under 3 years ('short leases') via s.54(2) LPA 1925 (oral agreement, market rent, immediate possession). Equitable leases: arise from failure of legal formalities (e.g., no deed) but a valid contract (Walsh v Lonsdale).",
            examTip: "Short leases (s.54(2) LPA): can be created orally, take effect in possession, at best rent reasonably obtainable, without taking a fine. If over 3 years but no deed, may be equitable lease if contract valid (s.2 LP(MP)A 1989). An equitable lease is vulnerable to purchasers if not protected on the register (notice)."
          },
          {
            name: "Covenants in Leases",
            keyCase: "Spencer's Case [1583] / Landlord and Tenant (Covenants) Act 1995 (LT(C)A 1995)",
            principle: "Promises within a lease (e.g., tenant's promise to pay rent, landlord's promise to repair). Old leases (pre-1996): privity of contract and privity of estate. New leases (post-1996, LT(C)A 1995): original tenant generally released on assignment, assignee bound by all 'landlord and tenant' covenants.",
            examTip: "Old leases: original tenant remains liable for full term even after assignment (privity of contract). New leases (LT(C)A 1995): aim to ensure covenants are enforceable by/against current landlord and tenant. Tenant assignee automatically liable. Landlord assignee automatically gets benefit/burden. Original tenant released unless landlord requires guarantee. Covenants 'touch and concern' the land."
          },
          {
            name: "Termination of Leases",
            keyCase: "Various",
            principle: "Ways a lease can end: effluxion of time (fixed term), notice to quit (periodic tenancy), surrender, merger, forfeiture (landlord's right to end for breach), break clauses.",
            examTip: "Forfeiture: landlord must serve notice (s.146 LPA 1925) and go to court (or peaceable re-entry for commercial if no one resident). Tenant can seek relief from forfeiture. Break clauses: express right for either party to terminate early by giving notice. Surrender: tenant gives up lease, landlord accepts. Merger: tenant acquires freehold, or landlord acquires leasehold, and interests merge."
          }
        ]
      }
    ]
  },
  "Trusts": {
    icon: Scale,
    color: "purple",
    description: "Creation, Certainties, Types, Beneficiary Principle & Trustees' Duties",
    sections: [
      {
        title: "Creation of Express Private Trusts",
        topics: [
          {
            name: "Three Certainties",
            keyCase: "Knight v Knight [1840] / Lambe v Eames [1871]",
            principle: "For a valid express trust: (1) Certainty of Intention (to create trust), (2) Certainty of Subject Matter (trust property), (3) Certainty of Objects (beneficiaries). Failure = no trust or different disposition.",
            examTip: "Intention: use imperative words ('shall hold on trust'), not precatory words ('hope', 'desire' - Lambe v Eames). Subject matter: clear what property is subject to trust AND beneficial shares (Palmer v Simmonds - 'bulk' too vague). Objects: clear who beneficiaries are. Fixed trust: 'list certainty' (IRC v Broadway Cottages). Discretionary trust: 'is or is not' test (McPhail v Doulton - can it be said with certainty whether any given individual is or is not a member of the class?)."
          },
          {
            name: "Constitution of Trusts",
            keyCase: "Milroy v Lord [1862] / Re Rose [1952]",
            principle: "Transfer of property to trustees (or self as trustee) must be correctly constituted. 'Equity will not perfect an imperfect gift' nor 'assist a volunteer'. Methods: (1) outright gift, (2) transfer to trustees, (3) self-declaration of trust.",
            examTip: "Milroy v Lord: must use correct mode of transfer for property type. Shares require transfer form + registration (Re Rose - 'every effort' rule: if settlor did everything he could, equity may complete). Land requires deed + registration (s.52 LPA 1925, LRA 2002). Chattels by delivery or deed. Exceptions: Re Rose, Strong v Bird (perfecting imperfect gift if donee executor), Donatio Mortis Causa (gift in contemplation of death), Pennington v Waine (unconscionability)."
          },
          {
            name: "Formalities for Trusts",
            keyCase: "LPA 1925 s.53",
            principle: "Trusts of land must be evidenced in writing (s.53(1)(b) LPA 1925). Dispositions of existing equitable interests must be in writing (s.53(1)(c) LPA 1925). Other trusts (personal property) can be created orally.",
            examTip: "S.53(1)(b): trust of land must be 'manifested and proved by some writing' (not created by writing). Failure means trust is unenforceable, property reverts to settlor. S.53(1)(c): disposition of existing equitable interest MUST be in writing. Failure means disposition is void (Timpson's Executors). Avoids secret oral dealings."
          },
          {
            name: "Secret Trusts",
            keyCase: "Blackwell v Blackwell [1929]",
            principle: "Operate outside the Wills Act 1837 formalities. Fully secret trust: will appears to leave gift absolutely to legatee. Half secret trust: will indicates property held on trust, but not terms. Based on fraud principle/dehors the will theory.",
            examTip: "Fully secret: communication of trust terms + acceptance by trustee must occur ANY time before testator's death. Half secret: communication + acceptance MUST be before or at time of will's execution (Blackwell v Blackwell). Both require: intention, communication, acceptance. If FS trust fails, legatee takes absolutely. If HS trust fails, property held on resulting trust for residuary estate."
          }
        ]
      },
      {
        title: "Purpose Trusts & Charities",
        topics: [
          {
            name: "The Beneficiary Principle",
            keyCase: "Morice v Bishop of Durham [1804] / Re Astors Settlement Trusts [1952]",
            principle: "A trust must have ascertainable human beneficiaries who can enforce it (Morice v Bishop of Durham). Exceptions are anomalous (e.g., graves, animals) or charitable trusts.",
            examTip: "A trust without beneficiaries is unenforceable and void (Re Astors). 'Human beneficiaries' means specific people or a class of people. Purpose trusts are generally void unless they fall into a recognized exception. The 'human beneficiary principle' ensures someone can hold the trustees to account."
          },
          {
            name: "Permitted Purpose Trusts",
            keyCase: "Re Endacott [1960]",
            principle: "Anomalous exceptions to beneficiary principle (Re Endacott): (1) construction/maintenance of graves/monuments (limited duration), (2) maintenance of specific animals (pet trusts), (3) promotion of fox hunting (now redundant). Must be within 'capricious' limits.",
            examTip: "These exceptions are very narrow and will not be extended. They usually have to be for a limited duration (e.g., 21 years or human life + 21 years) and for a specific, identifiable purpose. Otherwise, purpose trusts are void for lacking beneficiaries to enforce them."
          },
          {
            name: "Charitable Trusts",
            keyCase: "Charities Act 2011 / Pemsel's Case [1891]",
            principle: "Exceptions to beneficiary principle. Must be for a recognised charitable purpose (s.2 Charities Act 2011) and for the public benefit. Examples: relief of poverty, advancement of education, religion, health, arts.",
            examTip: "Charitable purposes (s.3 Charities Act 2011): 13 heads, e.g., poverty, education, religion. Public benefit: (1) identifiable benefit, (2) benefit must be to public or section of public. No private benefit (unless incidental). Cannot be for political purposes. Fiscal advantages (tax exemptions). Cy-près doctrine: if original purpose fails, court can apply funds to similar charitable purpose."
          }
        ]
      },
      {
        title: "Implied & Resulting Trusts",
        topics: [
          {
            name: "Resulting Trusts",
            keyCase: "Stack v Dowden [2007]",
            principle: "Arise by operation of law. Presumed when (1) voluntary transfer of property, (2) contribution to purchase price. Presumption can be rebutted by evidence of contrary intention (e.g., gift, loan).",
            examTip: "Voluntary transfer: A transfers to B for no consideration, presumption B holds on RT for A. Purchase money: A pays for property conveyed into B's name, presumption B holds on RT for A (proportionate to contribution). Presumption of advancement (transfer from husband to wife, or parent to child) can rebut RT, but less weight post-Stack v Dowden. RT reflects original intention."
          },
          {
            name: "Constructive Trusts",
            keyCase: "Lloyds Bank v Rosset [1991] / Stack v Dowden [2007] / Jones v Kernott [2011]",
            principle: "Imposed by court to prevent unconscionable conduct. Arise where common intention (express or inferred) that claimant should have beneficial interest, and claimant acted to their detriment in reliance on this. Quantified by holistic approach.",
            examTip: "Common intention: express (agreement) or inferred (direct financial contribution to purchase price - Rosset). Detriment: claimant acts to their detriment in reliance on common intention. Quantification (Stack v Dowden, Jones v Kernott): holistic approach, court considers whole course of dealing. Depart from equal shares if impossible to infer common intention for equal shares and entire course of dealing suggests otherwise. Unconscionable = unjust/unfair."
          }
        ]
      },
      {
        title: "Trustees",
        topics: [
          {
            name: "Appointment & Retirement",
            keyCase: "Trustee Act 1925 (TA 1925) / Trustee Act 2000 (TA 2000)",
            principle: "Appointment: by instrument (settlor), statute (s.36 TA 1925 - by existing trustees/personal representatives), or court. Retirement: by deed (s.39 TA 1925), by court, or by beneficiaries (under Saunders v Vautier). Max 4 trustees for land.",
            examTip: "S.36 TA 1925: power to appoint new trustee if existing trustee dies, remains out of UK for 12 months, desires to be discharged, refuses to act, unfit, or incapable. Can also be removed by court (inherent jurisdiction) if against beneficiaries' welfare. Beneficiaries (adults, sui juris, absolutely entitled) can terminate trust under Saunders v Vautier."
          },
          {
            name: "Duties of Trustees",
            keyCase: "Trustee Act 2000 / Speight v Gaunt [1883]",
            principle: "Fiduciary duties (loyalty, no profit, no conflict, no unauthorized remuneration). Statutory duties (TA 2000): duty of care, investment, delegation. Must act impartially, consider beneficiaries' interests.",
            examTip: "Fiduciary duties are strict. No profit rule (Boardman v Phipps). No conflict rule (self-dealing, fair-dealing). Duty of care (s.1 TA 2000): objective standard of reasonable business person. Investment (s.3 TA 2000): power to invest in any kind of investment. Delegation (s.11 TA 2000): can delegate investment, property management, but must review. Must act unanimously (unless specified otherwise). Keep accounts, provide information."
          },
          {
            name: "Powers of Trustees",
            keyCase: "Trustee Act 2000 / TA 1925",
            principle: "Power of investment (s.3 TA 2000). Power of delegation (s.11 TA 2000). Power of maintenance (s.31 TA 1925 - income for minor beneficiary). Power of advancement (s.32 TA 1925 - capital for minor/adult beneficiary).",
            examTip: "Powers are discretionary. Trustees must consider exercising them (Re Beloved Wilkes' Charity). Power of advancement: for 'advantage' or 'benefit' (not just necessities), up to full share (TA 2000 amends s.32 to remove 50% limit). Must act with duty of care when exercising powers. Beneficiaries cannot compel exercise of power, but can challenge if powers exercised improperly (e.g., bad faith)."
          },
          {
            name: "Breach of Trust & Liability",
            keyCase: "Target Holdings v Redferns [1996]",
            principle: "Trustee is personally liable to beneficiaries for losses caused by breach of trust. Measure of damages: restore trust fund to position it would have been in if no breach (Target Holdings). Causation required.",
            examTip: "Defences: (1) trustee acted honestly and reasonably (s.61 TA 1925 - court's discretion to relieve from liability), (2) beneficiary consented/concurred, (3) exclusion clause (if not for fraud/gross negligence), (4) limitation period (6 years). Joint and several liability for multiple trustees (unless one fraudulently induces others). Contribution from co-trustees. Indemnity from beneficiary if fraud/breach for their benefit."
          }
        ]
      }
    ]
  },
  "Business": {
    icon: Briefcase,
    color: "teal",
    description: "Business Forms, Company Formation, Governance, Directors & Finance",
    sections: [
      {
        title: "Business Forms",
        topics: [
          {
            name: "Sole Trader",
            keyCase: "None",
            principle: "Simplest form. Individual owns and runs business. Unlimited personal liability for business debts. Few formalities. Business is not a separate legal entity from owner.",
            examTip: "Advantages: easy to set up, full control, keeps all profits. Disadvantages: unlimited liability (personal assets at risk), difficult to raise finance, lack of continuity, heavy workload. Taxed through self-assessment (income tax, NI)."
          },
          {
            name: "Partnership",
            keyCase: "Partnership Act 1890 (PA 1890)",
            principle: "Two or more persons carrying on a business with a view of profit (s.1 PA 1890). Unlimited joint and several liability for partnership debts. Each partner is agent of firm. Agreement can be oral, written or implied.",
            examTip: "Advantages: easy to set up, shared workload/expertise, more capital than sole trader. Disadvantages: unlimited joint and several liability (personal assets at risk), potential for disputes, lack of continuity. A partnership agreement (deed of partnership) is highly recommended to clarify terms, profit sharing, decision-making, etc. Partners liable for torts/contracts of other partners in ordinary course of business. Dissolution by notice, death/bankruptcy, or court order."
          },
          {
            name: "Limited Liability Partnership (LLP)",
            keyCase: "Limited Liability Partnerships Act 2000",
            principle: "Hybrid structure. Separate legal entity from its members. Members have limited liability (similar to shareholders). Combines organisational flexibility of partnership with limited liability of company.",
            examTip: "Advantages: limited liability for members, separate legal personality, tax transparency (taxed like partnership). Disadvantages: more formal to set up than partnership, public reporting requirements (Companies House), more regulation. Must have LLP agreement. All members are agents of the LLP."
          },
          {
            name: "Company",
            keyCase: "Companies Act 2006 (CA 2006)",
            principle: "Separate legal entity (Salomon v Salomon). Owners (shareholders) have limited liability. Managed by directors. Most common is Private Limited Company (Ltd).",
            examTip: "Advantages: limited liability for shareholders (risk limited to investment), separate legal personality (can sue/be sued, own assets), easier to raise finance, continuity. Disadvantages: more complex/costly to set up/run, public disclosure requirements, greater regulation. Can be public (PLC) or private (Ltd). Private companies cannot offer shares to public."
          }
        ]
      },
      {
        title: "Company Formation & Constitution",
        topics: [
          {
            name: "Separate Legal Personality & Limited Liability",
            keyCase: "Salomon v Salomon & Co Ltd [1897]",
            principle: "Company is distinct legal entity from its shareholders and directors (Salomon). Shareholders' liability limited to unpaid value of shares. 'Veil of incorporation' protects personal assets.",
            examTip: "Salomon principle: fundamental. Company can contract with its members, sue/be sued. Veil of incorporation can be 'lifted' in exceptional circumstances: fraud (Gilford Motor Co v Horne), agency (Smith Stone & Knight), or statute (e.g., wrongful/fraudulent trading under Insolvency Act 1986). Prest v Petrodel Resources: veil only lifted if company used to evade existing obligation."
          },
          {
            name: "Memorandum & Articles of Association",
            keyCase: "Companies Act 2006 (CA 2006)",
            principle: "Memorandum (s.8 CA 2006): states subscribers wish to form company and agree to become members. Articles of Association (s.18 CA 2006): company's internal rulebook, governs relations between company and members. Model Articles apply by default.",
            examTip: "Memorandum is now short and basic. Articles: internal rules, can be adopted (Model Articles), amended, or bespoke. Form a statutory contract between company and members, and between members themselves (s.33 CA 2006 - Hickman v Kent or Romney Marsh Sheepbreeders' Association). Members can enforce against company, company against members. Cannot be enforced by company against member in capacity other than member (Eley v Positive Government Security Life Assurance Co)."
          },
          {
            name: "Company Capacity & Authority",
            keyCase: "Ashbury Railway Carriage and Iron Co Ltd v Riche [1875] / Re Rolled Steel Products Ltd [1986]",
            principle: "Company capacity (objects clause): CA 2006 s.31 says company's objects are unrestricted. Pre-CA 2006 objects clause (ultra vires) could limit capacity. Directors' authority: actual (express/implied), apparent/ostensible (Freeman & Lockyer v Buckhurst Park Properties).",
            examTip: "Pre-CA 2006: ultra vires (beyond objects) transactions were void (Ashbury). Now (s.39 CA 2006): validity of act not called into question for lack of capacity. Protections for third parties dealing in good faith (s.40 CA 2006). Directors' authority: Actual (express board resolution or implied from job title). Apparent: company held out director as having authority, third party relied in good faith (Turquand's Case / Royal British Bank v Turquand - 'indoor management rule')."
          },
          {
            name: "Share Capital & Loan Capital",
            keyCase: "None",
            principle: "Share capital: equity finance, shares issued to investors. Loan capital: debt finance, e.g., bank loans, debentures. Different rights and risks for investors. Dividends vs interest.",
            examTip: "Shares: provide voting rights, right to dividends (if declared), return of capital on winding up. Allotment (creation of new shares) vs transfer (selling existing shares). Debentures: security for loans (fixed or floating charge). Fixed charge (on specific assets) vs floating charge (on fluctuating assets like stock, crystallizes on event like winding up). Share capital rules: maintenance of capital, cannot return capital to shareholders unless statutory procedure."
          }
        ]
      },
      {
        title: "Directors & Company Governance",
        topics: [
          {
            name: "Types & Appointment of Directors",
            keyCase: "Companies Act 2006",
            principle: "Minimum one director for private company (s.154 CA 2006). Can be executive (involved in day-to-day management) or non-executive (monitoring, strategy). Appointed by ordinary resolution of members or board resolution.",
            examTip: "Shadow director: not formally appointed but dictates company's actions (s.251 CA 2006). De facto director: acts as director but not validly appointed. Both can be subject to statutory duties. Disqualification of directors: Insolvency Act 1986, Company Directors Disqualification Act 1986 (e.g., unfitness, bankruptcy). Director must be 16+."
          },
          {
            name: "Directors' Duties (CA 2006)",
            keyCase: "Companies Act 2006 ss.171-177",
            principle: "Seven statutory duties (CA 2006, ss.171-177), codified common law and equity. Duty to act within powers, promote success of company, exercise independent judgment, exercise reasonable care/skill/diligence, avoid conflicts of interest, not accept benefits from third parties, declare interest in proposed transactions.",
            examTip: "Duty to promote success (s.172): 'enlightened shareholder value' (consider stakeholders too). Duty of care/skill (s.174): objective + subjective test (Re D'Jan of London - standard of reasonably diligent person AND general knowledge/experience of THAT director). Conflict of interest (s.175): not to exploit company property/info/opportunity. Declaration of interest (s.177 for proposed, s.182 for existing). Remedies for breach: account of profits, damages, injunction, rescission."
          },
          {
            name: "Shareholder Meetings & Resolutions",
            keyCase: "Companies Act 2006",
            principle: "Annual General Meeting (AGM) mandatory for public companies. Private companies can dispense with AGMs. Resolutions: Ordinary Resolution (simple majority >50%) for most decisions. Special Resolution (75%) for major changes (e.g., change articles, share capital).",
            examTip: "Notice periods: 14 days for general meetings (private), 21 days for public AGMs. Quorum: minimum number of members for meeting to be valid (usually 2). Written resolutions: private companies can pass resolutions without a physical meeting (s.288 CA 2006). Voting: usually one share, one vote. Proxies: member can appoint another to attend and vote."
          }
        ]
      },
      {
        title: "Shareholder Remedies & Insolvency",
        topics: [
          {
            name: "Protection of Minorities",
            keyCase: "Foss v Harbottle [1843] / Re Brazilian Rubber Plantations [1911] / O'Neill v Phillips [1999]",
            principle: "Foss v Harbottle (proper plaintiff rule, internal management rule): courts won't intervene in internal company matters where breach of duty owed to company. Exceptions: derivative claims (s.260 CA 2006), unfair prejudice petition (s.994 CA 2006).",
            examTip: "Derivative claim: member brings claim on behalf of company (s.260 CA 2006), leave of court required. Unfair prejudice (s.994 CA 2006): where company's affairs conducted in a manner unfairly prejudicial to members' interests. O'Neill v Phillips: test is commercial unfairness, usually breach of articles/agreement or equitable consideration (e.g., quasi-partnership). Winding-up on 'just and equitable' grounds (s.122(1)(g) Insolvency Act 1986) - if deadlock or loss of trust. Minority shareholder remedies are crucial in small companies."
          },
          {
            name: "Company Insolvency & Winding Up",
            keyCase: "Insolvency Act 1986",
            principle: "Insolvency: inability to pay debts when due (cash flow) or liabilities exceed assets (balance sheet). Winding up (liquidation): company assets realised, distributed to creditors, company ceases to exist. Voluntary (members/creditors) or Compulsory (court order).",
            examTip: "Consequences of winding up: directors cease powers, liquidator takes over, company assets frozen. Order of payment: fixed charge holders, preferential creditors (e.g., employees up to a limit), floating charge holders, unsecured creditors, shareholders. Administration (s.8 Insolvency Act 1986): rescue mechanism, administrator attempts to save company or achieve better result than winding up."
          }
        ]
      }
    ]
  },
  "Dispute": {
    icon: Gavel,
    color: "pink",
    description: "Civil Litigation, ADR, Enforcement, Evidence & Costs",
    sections: [
      {
        title: "Civil Litigation Overview",
        topics: [
          {
            name: "Overriding Objective & Pre-Action Protocols",
            keyCase: "Civil Procedure Rules (CPR) Part 1",
            principle: "Overriding objective (CPR 1.1): enable court to deal with cases justly and at proportionate cost. Pre-action Protocols: set out steps parties should take before starting court proceedings. Encourage settlement, exchange info.",
            examTip: "Overriding objective factors: equality, saving expense, proportionality, speed, fairness, allocation of resources. Parties must help court achieve it (CPR 1.3). Pre-action Protocols: mandatory for many claim types (e.g., personal injury, construction). Non-compliance can lead to sanctions (e.g., costs penalties). Aims: avoid litigation, narrow issues, efficient management if litigation necessary."
          },
          {
            name: "Starting Proceedings & Case Management",
            keyCase: "CPR Part 7, 26, 29",
            principle: "Claim Form (CPR Part 7): starts proceedings. Directions Questionnaire (DQ): parties propose case management directions. Allocation to track (CPR 26): small claims (up to £10k), fast track (£10k-£25k), multi-track (over £25k).",
            examTip: "Claim Form served on defendant. Defendant responds with Acknowledgment of Service or Defence. Allocation: court considers value, complexity, likely length of trial. Small claims: less formal, no recovery of legal costs. Fast track: strict timetable (30 weeks), fixed costs. Multi-track: bespoke directions, active judicial management. Case Management Conference (CMC) on multi-track to set directions."
          },
          {
            name: "Disclosure & Witness Statements",
            keyCase: "CPR Part 31, 32",
            principle: "Disclosure (CPR 31): parties reveal documents relevant to case. Standard disclosure: documents relied on, adversely affect own/other case, support other case. Witness statements (CPR 32): written evidence of witnesses of fact.",
            examTip: "Disclosure statement confirms party understands and has complied. Redaction: remove irrelevant/privileged parts. Specific disclosure: court orders further disclosure. Inspection: other party can inspect disclosed documents. Witness statements: usually exchanged simultaneously, stand as evidence in chief, witness can be cross-examined. Hearsay evidence can be admitted, but weight may be affected."
          }
        ]
      },
      {
        title: "Alternative Dispute Resolution (ADR)",
        topics: [
          {
            name: "Types of ADR",
            keyCase: "Halsey v Milton Keynes General NHS Trust [2004]",
            principle: "Methods to resolve disputes outside traditional litigation. Examples: Negotiation, Mediation, Conciliation, Arbitration. Courts encourage ADR; unreasonable refusal can lead to costs sanctions (Halsey).",
            examTip: "Negotiation: direct discussions. Mediation: neutral third party facilitates discussion, parties retain control of outcome. Conciliation: neutral third party suggests solutions. Arbitration: neutral third party hears evidence, makes binding decision (like court, but private). Advantages of ADR: cheaper, quicker, confidential, preserves relationships, flexible outcomes. Disadvantages: not always binding (except arbitration), no precedent, power imbalance."
          },
          {
            name: "Mediation",
            keyCase: "Halsey v Milton Keynes General NHS Trust [2004]",
            principle: "Facilitative process where an independent mediator helps parties reach a mutually acceptable settlement. Mediator does not decide outcome. Confidential and voluntary.",
            examTip: "Mediator role: manages process, improves communication, helps identify issues, explores options. Parties retain ultimate control. Settlement agreement is contractual. Considerations for refusing ADR (Halsey): nature of dispute, merits of case, costs, delay, prospects of success. Court can impose costs sanction for unreasonable refusal (PGF II SA v OMFS Company 1 Ltd)."
          },
          {
            name: "Arbitration",
            keyCase: "Arbitration Act 1996",
            principle: "Private process where parties refer dispute to an arbitrator(s) for a binding decision (award). Governed by Arbitration Act 1996. Can be faster, cheaper, more flexible than litigation. Limited grounds for appeal.",
            examTip: "Agreement to arbitrate usually in contract. Arbitrator acts as judge. Award is binding, enforceable like court judgment. Advantages: privacy, expertise of arbitrator, flexibility of procedure, international enforceability (New York Convention). Disadvantages: limited rights of appeal, can be expensive for complex cases, discovery often more limited than litigation."
          }
        ]
      },
      {
        title: "Evidence & Enforcement",
        topics: [
          {
            name: "Burden & Standard of Proof",
            keyCase: "None",
            principle: "Civil cases: claimant bears legal burden. Standard of proof: balance of probabilities ('more likely than not').",
            examTip: "Balance of probabilities: 51% chance or more. 'He who asserts must prove'. Evidential burden: party must produce enough evidence to make issue worthy of consideration. Shifting burden: certain presumptions can shift burden (e.g., res ipsa loquitur in negligence)."
          },
          {
            name: "Types of Evidence",
            keyCase: "None",
            principle: "Oral (witness testimony, cross-examination), Documentary (contracts, letters, emails), Real (physical objects), Expert (opinion from specialists). Admissibility rules apply.",
            examTip: "Expert evidence (CPR 35): requires court permission, duty to court, not party. Opinion evidence generally inadmissible from non-experts. Hearsay: statement made out of court, repeated in court to prove truth of matter asserted. Admissible in civil (Civil Evidence Act 1995), but weight can be challenged."
          },
          {
            name: "Enforcement of Judgments",
            keyCase: "Various",
            principle: "Methods to compel losing party to pay damages or comply with court order. Examples: Warrant of Control (seize goods), Charging Order (on land), Attachment of Earnings (deduct from salary), Third Party Debt Order (freeze bank account).",
            examTip: "Claimant chooses enforcement method based on debtor's assets. Warrant of Control: bailiffs seize and sell goods. Charging Order: converts judgment into charge over property, can lead to order for sale. Attachment of Earnings: for employed debtors. Third Party Debt Order: freezes funds held by third party (e.g., bank, debtor). Information order (CPR 71): debtor interrogated about assets."
          }
        ]
      },
      {
        title: "Costs",
        topics: [
          {
            name: "General Rule & Exceptions",
            keyCase: "CPR Part 44",
            principle: "General rule ('loser pays'): unsuccessful party pays successful party's costs (CPR 44.2). Court has discretion. Exceptions: Part 36 offers, conduct of parties, small claims track.",
            examTip: "Court considers conduct (delay, misleading, rejecting ADR). Small claims track: generally no recovery of legal costs (only court fees, fixed disbursements). Part 36 offer: formal offer to settle. If claimant makes offer and gets better at trial, benefits (indemnity costs, higher interest). If defendant makes offer and claimant does no better/worse, claimant pays defendant's costs from certain date."
          },
          {
            name: "Assessment of Costs & Funding",
            keyCase: "CPR Part 44, 47",
            principle: "Costs assessed on standard basis (proportionate and reasonable) or indemnity basis (all costs unless unreasonable). Funding: Conditional Fee Agreements (CFAs), Damages-Based Agreements (DBAs), Legal Aid, ATE insurance.",
            examTip: "Standard basis: doubts resolved in favour of paying party. Indemnity basis: doubts resolved in favour of receiving party (higher recovery). CFA: 'no win, no fee' - success fee if win. DBA: % of damages if win. ATE (After the Event) insurance: covers own disbursements and adverse costs if lose. Legal Aid: means/merits tested, limited availability for civil."
          }
        ]
      }
    ]
  },
  "Property": {
    icon: Building,
    color: "blue",
    description: "Freehold Covenants, Easements, Mortgages & Co-ownership (Refresher)",
    sections: [
      {
        title: "Freehold Covenants",
        topics: [
          {
            name: "Definition & Types",
            keyCase: "Tulk v Moxhay [1848]",
            principle: "Promise made by deed (covenantor) relating to land. Benefit: receives the promise. Burden: bound by the promise. Restrictive (negative, prevents doing something) or Positive (requires doing something).",
            examTip: "Restrictive covenant: e.g., 'not to build more than one house'. Positive covenant: e.g., 'to maintain a fence'. Generally, burdens of positive covenants do not run with the land in equity or common law (Austerberry v Oldham Corp). Burdens of restrictive covenants can run in equity (Tulk v Moxhay)."
          },
          {
            name: "Running of Covenants at Common Law",
            keyCase: "Smith & Snipes Hall Farm v River Douglas Catchment Board [1949]",
            principle: "Benefit runs if (1) covenant 'touches and concerns' the land, (2) original parties intended benefit to run, (3) legal estate held by claimant. Burden does not run at common law (Austerberry v Oldham Corp).",
            examTip: "Touches and concerns: affects nature, quality, mode of use or value of the land. Intention: express or implied (s.78 LPA 1925 implies intention for benefit to run). Legal estate: claimant must hold legal estate. This applies to both positive and restrictive covenants. The main challenge is always getting the burden to run."
          },
          {
            name: "Running of Covenants in Equity",
            keyCase: "Tulk v Moxhay [1848]",
            principle: "Burden of restrictive covenants can run in equity if (1) covenant is restrictive, (2) touches and concerns the land, (3) original parties intended burden to run, (4) successor has notice (registered land: notice, unregistered: C(iv) land charge). (Tulk v Moxhay).",
            examTip: "Restrictive only: burden of positive covenants does not run in equity. Touches and concerns: must benefit covenantee's land. Intention: s.79 LPA 1925 implies intention to bind successors. Notice: crucial for enforceability. Registered land: must be protected by a notice on the charges register (s.32 LRA 2002). Unregistered land: must be registered as a Class D(ii) Land Charge (Land Charges Act 1972). Failure to register means void against purchaser."
          },
          {
            name: "Methods to Enforce Positive Covenants",
            keyCase: "Rhone v Stephens [1994]",
            principle: "As burden of positive covenants does not run, indirect methods needed: (1) chain of indemnity covenants, (2) creation of a 'rentcharge' (now limited), (3) 'estate rentcharge' (can attach conditions), (4) commonhold.",
            examTip: "Chain of indemnity: each successive purchaser promises to indemnify the previous owner for any breach. Breaks if chain broken. Rhone v Stephens confirmed positive burdens don't run. Rentcharges: no new ones generally since 1977, existing expire 2037. Commonhold: specific form of tenure for interdependent properties (e.g., flats) where positive covenants automatically run."
          }
        ]
      },
      {
        title: "Easements & Profits à Prendre",
        topics: [
          {
            name: "Characteristics of an Easement",
            keyCase: "Re Ellenborough Park [1956]",
            principle: "Four characteristics (Re Ellenborough Park): (1) dominant and servient tenement, (2) diversity of ownership/occupation, (3) easement must accommodate the dominant tenement, (4) capable of forming subject matter of a grant (not too vague, no positive burden, not deprive servient owner of possession).",
            examTip: "Dominant tenement (DT): land benefiting. Servient tenement (ST): land burdened. Accommodate DT: must benefit land, not just owner personally (Hill v Tupper contra). Capable of grant: must be clear, not require ST owner to do something (unless fencing), not too extensive (Copeland v Greenhalf). 'New' easements can be created if meet criteria (e.g., storage, parking)."
          },
          {
            name: "Methods of Creation",
            keyCase: "Wheeldon v Burrows [1879] / LPA 1925 s.62",
            principle: "Express grant/reservation (by deed). Implied grant/reservation: (1) necessity, (2) common intention, (3) rule in Wheeldon v Burrows (quasi-easements), (4) s.62 LPA 1925 (converts licences into easements). Prescription (long use).",
            examTip: "Necessity: DT would be landlocked otherwise. Common intention: necessary for purpose parties intended. Wheeldon v Burrows: on sale of part, quasi-easements become full easements if continuous, apparent, and necessary for reasonable enjoyment. S.62 LPA 1925: conveyance of land 'carries with it' existing rights/advantages. Can turn a revocable licence into a legal easement if there is diversity of occupation + conveyance (Sovmots Investments v Secretary of State). Prescription: 20 years continuous use 'as of right' (without force, secrecy, or permission)."
          },
          {
            name: "Profits à Prendre",
            keyCase: "None",
            principle: "Right to take something from another's land (e.g., fish, timber, grazing rights). Can exist 'in gross' (without dominant tenement). Created by deed or prescription.",
            examTip: "Key difference from easement: right to take, not just use. Can exist without DT (in gross), whereas easements always require both DT and ST. Examples: grazing (common pasture), turbary (cutting turf), piscary (fishing). Created and enforced similarly to easements."
          }
        ]
      },
      {
        title: "Mortgages",
        topics: [
          {
            name: "Nature & Creation",
            keyCase: "LPA 1925 / LRA 2002",
            principle: "Security for a loan. Legal mortgage: over registered freehold/leasehold by charge by deed (s.85/86 LPA 1925) and must be registered (s.27 LRA 2002). Equitable mortgage: if formalities for legal mortgage not met (e.g., no deed) but contract for mortgage (s.2 LP(MP)A 1989), or interest is equitable.",
            examTip: "Mortgagor: borrower. Mortgagee: lender. Legal charge: most common method, charge on the land rather than transfer of legal estate. Registered land: entry of notice on register. Equitable mortgages: e.g., mortgage of equitable interest (beneficiary mortgaging their share in trust property), or failed legal mortgage. Protection for equitable mortgages: C(iii) land charge (unregistered), notice (registered)."
          },
          {
            name: "Rights of Mortgagor",
            keyCase: "Fairclough v Swan Brewery Co Ltd [1912] / Kreglinger v New Patagonia Meat and Cold Storage Co Ltd [1914]",
            principle: "Equity of redemption: right to redeem property free from charge once loan repaid. 'Clogs' on equity of redemption: terms that prevent/postpone redemption (Fairclough) or grant mortgagee collateral advantages (Kreglinger - if unconscionable/repugnant to equity).",
            examTip: "Clogs: No postponement of redemption beyond a reasonable period or if it renders redemption illusory. No unconscionable collateral advantages (e.g., mortgagee selling own products exclusively after redemption). Undue influence (RBS v Etridge) by third parties can make mortgage unenforceable against mortgagor. Right to possess (s.6 CJA 1980 - court can postpone possession)."
          },
          {
            name: "Rights & Remedies of Mortgagee",
            keyCase: "Cuckmere Brick Co Ltd v Mutual Finance Ltd [1971] / Tse Kwong Lam v Wong Chit Sen [1983]",
            principle: "Rights: possession, sale, appointment of receiver, foreclosure. Power of sale arises when mortgage money due, exercisable when s.103 LPA 1925 conditions met. Duty to get 'true market value' on sale (Cuckmere).",
            examTip: "Possession: 'go to court' usually required, especially for residential. Power of sale: arises when mortgage date passed. Exercisable when: (1) notice requiring payment served and three months defaulted, or (2) interest in arrears for 2 months, or (3) breach of other covenant. Duty of care on sale: act in good faith, take reasonable steps to get best price (not necessarily highest, but true market value - Tse Kwong Lam). Foreclosure: rare, vests property in mortgagee, extinguishes equity of redemption."
          }
        ]
      },
      {
        title: "Co-ownership (Advanced)",
        topics: [
          {
            name: "Resulting & Constructive Trusts (Refresher)",
            keyCase: "Stack v Dowden [2007] / Jones v Kernott [2011]",
            principle: "Resulting trusts: focus on actual financial contribution to purchase price (often in unmarried couples where legal title in one name). Constructive trusts: common intention (express or inferred) + detrimental reliance. Courts now prefer holistic approach for quantification.",
            examTip: "Stack v Dowden / Jones v Kernott: in domestic context, start with presumption of joint beneficial ownership if joint legal ownership. If sole legal ownership, burden on claimant to show common intention constructive trust (Rosset). Quantification: if common intention proven, court determines shares based on whole course of dealing, not just financial contributions. This often involves inferring or imputing intention."
          },
          {
            name: "Overreaching",
            keyCase: "LPA 1925 s.2 & s.27 / City of London Building Society v Flegg [1988]",
            principle: "Process by which beneficial interests under a trust of land are detached from the land and transferred to the purchase money. Occurs when purchaser pays capital money to at least two trustees. Beneficial interest then binds the money, not the land.",
            examTip: "Crucial for purchasers. If beneficial interests are overreached, they do not bind the purchaser, even if the beneficiaries were in actual occupation (City of London BS v Flegg). Requires capital money (purchase price) to be paid to at least two trustees (s.27 LPA 1925). If only one trustee, beneficial interests may remain on the land as overriding interests (Williams & Glyn's Bank v Boland)."
          }
        ]
      }
    ]
  },
  "Wills": {
    icon: FileText,
    color: "blue",
    description: "Will Validity, Revocation, Alterations, Intestacy & PRs",
    sections: [
      {
        title: "Will Validity & Formalities",
        topics: [
          {
            name: "Capacity",
            keyCase: "Banks v Goodfellow [1870]",
            principle: "Testator must have testamentary capacity at time of making will. 'Soundness of mind, memory and understanding' (Banks v Goodfellow): (1) understand nature of act, (2) extent of property, (3) claims of those normally provided for, (4) not suffering from mental disorder affecting disposition.",
            examTip: "Onus on propounder of will to prove capacity. If there are doubts, medical evidence should be obtained. Capacity can fluctuate (e.g., lucidity during illness). If D has capacity then later loses it, capacity must be present at time of instruction and execution."
          },
          {
            name: "Intention",
            keyCase: "None",
            principle: "Testator must have 'animus testandi' (intention to make a will). Must intend to dispose of property on death. Free from undue influence or duress.",
            examTip: "General intention: document intended to be a will. Specific intention: words used in will intended to take effect. Presumed if will duly executed (unless suspicious circumstances). Rebuttable presumption if suspicious circumstances (e.g., will prepared by beneficiary)."
          },
          {
            name: "Formalities (Wills Act 1837 s.9)",
            keyCase: "Wills Act 1837 s.9",
            principle: "Will must be (1) in writing, (2) signed by testator (or someone on their behalf, in their presence, by their direction), (3) signature intended to give effect to will, (4) in presence of two witnesses, (5) each witness attests (signs) in testator's presence.",
            examTip: "Strict requirements. Failure means will is void. 'In presence': sight or at least physical contiguity. Witness must be independent (beneficiary witness loses gift - s.15 WA 1837). 'Holographic wills' (handwritten, unwitnessed) are not valid in England & Wales (unless privileged). Exceptions: privileged wills (soldiers, sailors)."
          },
          {
            name: "Knowledge & Approval",
            keyCase: "None",
            principle: "Testator must know and approve the contents of the will. Presumed if capacity and formalities met, but can be rebutted (e.g., suspicious circumstances, blind testator).",
            examTip: "If will is read to/by a capable testator who executes it, knowledge & approval presumed. Rebuttal: if suspicious circumstances (e.g., prepared by a major beneficiary), burden shifts to propounder to prove knowledge and approval (e.g., reading aloud, independent advice). For blind/illiterate testator, explicit evidence of knowledge & approval is needed."
          },
          {
            name: "Undue Influence & Duress",
            keyCase: "Hall v Hall [1868]",
            principle: "Will invalid if made under undue influence (coercion) or duress (threats). Onus of proof on challenger. Must be 'irresistible pressure'. Not merely persuasion or flattery (Hall v Hall).",
            examTip: "Unlike inter vivos gifts (where UI can be presumed), there is NO presumption of undue influence in wills. Actual undue influence MUST be proven. This is difficult due to testator's death. Look for evidence of coercion, force, or fear that overpowered free will. Examples: threats, constant badgering, isolation from family."
          }
        ]
      },
      {
        title: "Revocation & Alterations",
        topics: [
          {
            name: "Methods of Revocation (Wills Act 1837 s.18, 20)",
            keyCase: "Wills Act 1837 s.18, 20",
            principle: "(1) Subsequent marriage/civil partnership (s.18). (2) Later will/codicil (s.20 - express or implied inconsistency). (3) Destruction (s.20 - by testator or another in their presence/direction) with intention to revoke.",
            examTip: "Marriage/CP (s.18): automatic revocation unless will made in contemplation of that marriage/CP. Later will (s.20): most common, usually contains revocation clause ('I revoke all former wills'). Implied revocation if later will inconsistent. Destruction (s.20): must be physical act of destruction (e.g., burning, tearing) PLUS intention to revoke. If only one, not revoked (Re Daintree & Stott - crossing out is not enough)."
          },
          {
            name: "Conditional & Partial Revocation",
            keyCase: "Dixon v Solicitor-General [1946]",
            principle: "Conditional revocation (Dependent Relative Revocation): revocation conditional on some event (e.g., making a new will) that does not happen. Original will not revoked. Partial revocation: deleting part of will, valid if correct formalities followed or can infer intention.",
            examTip: "DRR: 'I revoke this will IF I make a new one.' If new one not made, old one stands. Court tries to ascertain testator's intention. Partial revocation: if only part destroyed with intention to revoke that part, remainder stands. If an alteration is not properly executed (e.g., no attestation), original words still stand (Dixon v Solicitor-General)."
          },
          {
            name: "Alterations (Wills Act 1837 s.21)",
            keyCase: "Wills Act 1837 s.21",
            principle: "Alterations to a will after execution are valid only if executed with same formalities as a will (signed by testator and attested by two witnesses). Unattested alterations are generally invalid.",
            examTip: "If unattested alteration (e.g., striking out a gift): original words remain valid if still legible. If original words are 'obliterated' (made indecipherable) by the unattested alteration, then the original words are revoked, but the new words are not added (unless DRR applies). Best practice is to make a new will or a codicil for alterations."
          },
          {
            name: "Rectification of Wills (Administration of Justice Act 1982 s.20)",
            keyCase: "Administration of Justice Act 1982 s.20",
            principle: "Court can rectify a will if it fails to carry out the testator's intentions due to (1) a clerical error or (2) a failure to understand testator's instructions. Application within 6 months of grant of probate.",
            examTip: "Clerical error: simple mistakes in drafting/typing. Failure to understand instructions: draftsman misunderstands. Not for correcting testator's own mistakes or changing intention. Aim is to give effect to testator's true intentions, not what they actually signed if it differs due to error. Strict time limit."
          },
          {
            name: "Interpretation of Wills",
            keyCase: "Various",
            principle: "Courts apply rules of construction to ascertain testator's intention from words used. Modern approach: purposive construction, considering surrounding circumstances. Extrinsic evidence can be admitted for ambiguity (s.21 AJA 1982).",
            examTip: "Prima facie meaning of words. If clear, no further interpretation. If ambiguous or meaningless, extrinsic evidence (e.g., testator's declarations, circumstances) allowed (s.21 AJA 1982). Presumptions (e.g., against intestacy) can assist. Key is to avoid ambiguity when drafting."
          }
        ]
      },
      {
        title: "Intestacy",
        topics: [
          {
            name: "Total & Partial Intestacy",
            keyCase: "Administration of Estates Act 1925 (AEA 1925)",
            principle: "Total intestacy: no valid will. Partial intestacy: valid will exists but doesn't dispose of all property. Rules set out in AEA 1925 dictate how property is distributed.",
            examTip: "Partial intestacy often arises if a gift fails, or if a will only disposes of part of the estate. Property not disposed of by will passes under intestacy rules. Rules are based on family relationships. Spouse/CP always gets preferential treatment."
          },
          {
            name: "Intestacy Rules (AEA 1925)",
            keyCase: "Administration of Estates Act 1925 (AEA 1925) s.46, as amended",
            principle: "Order of distribution: (1) Spouse/Civil Partner + Issue: SP gets personal chattels, statutory legacy (£322k from 2023) + half remaining residue. Issue gets other half residue. (2) Spouse/CP NO Issue: SP gets whole estate. (3) NO Spouse/CP: Issue, then Parents, then Siblings (whole blood), then Grandparents, then Uncles/Aunts, then Crown.",
            examTip: "Issue: children, grandchildren, etc. Per stirpes: issue take their parent's share (if parent predeceased). Adopted children count as issue of adoptive parents. Cohabitants are NOT included in intestacy rules. Common problem: where statutory legacy + half residue is not enough to cover property, spouse may not inherit house outright if it's the main asset. Property held on statutory trust for sale."
          },
          {
            name: "Statutory Trusts for Issue",
            keyCase: "AEA 1925 s.47",
            principle: "Where issue inherit under intestacy, they take their share on statutory trusts. They must reach 18 or marry/form CP younger to inherit absolutely. Contingent interests.",
            examTip: "Statutory trusts: if issue are minors, their share is held on trust. They get income from 18, and capital when they vest. If no issue, the property passes to the next category of relatives."
          },
          {
            name: "Inheritance (Provision for Family and Dependants) Act 1975",
            keyCase: "Ilott v Mitson [2017]",
            principle: "Allows certain categories of applicants to apply to court for 'reasonable financial provision' from deceased's estate if will/intestacy rules do not provide it. Categories: spouse/CP, former spouse/CP, child, financial dependant.",
            examTip: "Court considers factors (s.3): financial needs/resources, obligations/responsibilities, size/nature of estate, applicant's age/disability, conduct. For spouse/CP, 'surviving spouse standard' (what they would reasonably expect from divorce). For others, 'maintenance standard' (what is needed for day-to-day living). Ilott v Mitson highlights court's wide discretion but also difficulties for adult children claims. Cohabitants can claim if they lived as spouse/CP for 2 years or more."
          }
        ]
      },
      {
        title: "Personal Representatives",
        topics: [
          {
            name: "Executors & Administrators",
            keyCase: "None",
            principle: "Executors: appointed by will. Administrators: appointed by court if no will or no valid executors. Both are 'Personal Representatives' (PRs) responsible for administering estate.",
            examTip: "Executors derive authority from will (from date of death). Administrators derive authority from grant of administration (from date of grant). Max 4 PRs for legal title to land. PRs hold office jointly. If no will, priority order for administrators (Non-Contentious Probate Rules 1987)."
          },
          {
            name: "Grant of Probate & Administration",
            keyCase: "None",
            principle: "Grant of Probate: issued to executors when valid will. Grant of Letters of Administration (with will annexed): issued when valid will but no willing/able executors. Grant of Letters of Administration: issued when no valid will (intestacy).",
            examTip: "The Grant is official confirmation of PRs' authority, needed to deal with assets (e.g., bank accounts, land). Application to Probate Registry. Value of estate determines if grant needed. Small estates may not require one. Resealing for foreign grants."
          },
          {
            name: "Duties of Personal Representatives",
            keyCase: "AEA 1925",
            principle: "Duties: (1) collect assets, (2) pay debts/expenses (including taxes), (3) distribute residue to beneficiaries. Act impartially, with due diligence, provide accounts.",
            examTip: "Collect assets: identify, value, secure. Pay debts: in specific order (funeral, testamentary expenses, secured, preferential, unsecured). Taxes: inheritance tax (IHT), income tax, capital gains tax. Distribute: according to will or intestacy rules. PRs hold assets on bare trust for beneficiaries. Breach of duty can lead to personal liability."
          },
          {
            name: "IHT (Overview)",
            keyCase: "Inheritance Tax Act 1984",
            principle: "Tax on transfer of wealth on death. Payable on deceased's estate (assets minus liabilities). Nil-rate band (NRB) £325k. Residence Nil-Rate Band (RNRB) £175k (from 2020/21) if main residence passes to direct descendants. Rate usually 40%.",
            examTip: "NRB is transferable between spouses/CPs. RNRB also transferable. Exemptions: gifts to spouse/CP, charities, political parties. Potentially Exempt Transfers (PETs): gifts made 7 years before death are tax-free, but tapering relief between 3-7 years. Some lifetime gifts are immediately chargeable (e.g., gifts to trusts). IHT is complex; PRs must calculate and pay it."
          }
        ]
      }
    ]
  },
  "Criminal Practice": {
    icon: Gavel,
    color: "red",
    description: "Police Powers, Bail, Mode of Trial & Sentencing",
    sections: [
      {
        title: "Police Powers - PACE 1984",
        topics: [
          {
            name: "Stop & Search",
            keyCase: "PACE 1984 s.1",
            principle: "S.1: constable can stop/search person/vehicle if reasonable grounds suspect stolen/prohibited articles. S.2-3: name, station, grounds, object, entitlement. Record required. Code A applies.",
            examTip: "Reasonable grounds = objective test (not hunch). Must inform: name, station, object, grounds, entitlement to copy (GOWISELY). Cannot require removal of clothing in public except outer coat/jacket/gloves. S.60 CJPOA: without reasonable grounds if senior officer authorizes (anticipated violence)."
          },
          {
            name: "Arrest",
            keyCase: "PACE 1984 s.24",
            principle: "S.24: arrest without warrant if: offence committed/about to commit AND necessity criteria (name/address unknown, prevent harm/obstruction/disappearance). Inform of arrest and grounds.",
            examTip: "Any offence arrestable if necessity. Must inform arrested and why (Christie v Leachinsky). Use reasonable force (s.117). Citizen's arrest (s.24A): indictable offence only, must be committing/just committed. Breach of peace: common law power, imminent/actual breach."
          },
          {
            name: "Detention",
            keyCase: "PACE 1984 ss.37-44",
            principle: "Custody officer decides detention (s.37). Detention clock starts arrival at station. Time limits: 24 hours (standard), 36 hours (superintendent - indictable), 96 hours max (magistrates' court warrant). Reviews required.",
            examTip: "Detention authorized if necessary to secure/preserve evidence or obtain by questioning. 24 hours from arrival at station (or 24 hours after arrest if not taken to station immediately). Reviews: first 6 hours, then 9 hours. Can be postponed if questioning. Rights: legal advice, inform someone, consult Codes."
          },
          {
            name: "Right to Legal Advice",
            keyCase: "PACE 1984 s.58",
            principle: "S.58: right to consult solicitor privately at any time. Cannot be denied except: superintendent authorizes delay (up to 36 hours) for indictable offence if interfere with evidence/harm persons/alert accomplices. Breach = exclusion of evidence.",
            examTip: "Fundamental right. Delay rare (must be indictable + specific grounds). Legal advice free (duty solicitor). Consultation private (in person or telephone). Code C: must inform of right. Breach serious (evidence excluded - R v Samuel). Appropriate adult for juveniles/vulnerable."
          },
          {
            name: "Interview",
            keyCase: "PACE 1984 Code C",
            principle: "Caution required: 'You do not have to say anything. But it may harm your defence if you do not mention when questioned something which you later rely on in court. Anything you do say may be given in evidence.' Accurate record. Code C applies.",
            examTip: "Caution before any questions. Interview at police station (unless delay would cause harm). Accurate record (written/audio/video). Breaks required. Special warnings if adverse inference sought. Cannot interview if legal advice requested unless specific exceptions. Oppression/unreliability = exclusion (s.76)."
          },
          {
            name: "Identification",
            keyCase: "PACE 1984 Code D / R v Turnbull [1977]",
            principle: "Code D: video identification (VIPER) primary method. ID parade if video not possible. Group/confrontation last resort. Turnbull: identification evidence weak, judge must warn jury of dangers.",
            examTip: "VIPER (Video Identification Parade Electronic Recording): suspect + 8 similar. ID parade: suspect + 8 volunteers. Suspect can choose position. Solicitor present. Group ID: witness sees suspect in group. Confrontation: witness brought face-to-face (last resort). Turnbull warning: circumstances of identification, fleeting glance, distance, light, recognition."
          }
        ]
      },
      {
        title: "Bail",
        topics: [
          {
            name: "Right to Bail",
            keyCase: "Bail Act 1976",
            principle: "General right to bail (s.4) unless exceptions apply. Exceptions: fail to surrender, commit offence on bail, interfere with witnesses/obstruct justice, own protection, already on bail, insufficient information. Substantial grounds test.",
            examTip: "Presumption in favor of bail. Prosecution must show exception + substantial grounds. Factors: nature/seriousness, character/record, community ties, bail record, strength of evidence. Conditions possible: residence, surety, security, curfew, reporting, exclusion. Unconditional bail preferred. Murder/serious offences: restrictions."
          },
          {
            name: "Bail Conditions & Sureties",
            keyCase: "Bail Act 1976 s.3",
            principle: "Conditions if necessary: residence, surety, security, curfew, reporting, non-contact, exclusion. Must be proportionate. Surety: financial undertaking to ensure surrender. Security: deposit of money/property.",
            examTip: "Conditions must be necessary and proportionate. Surety: person guarantees defendant's surrender, forfeits money if fails. Security: defendant deposits money (returned if surrenders). Reporting: police station at specified times. Curfew: home between certain hours (electronic tag possible). Variation: apply to court."
          },
          {
            name: "Breach of Bail",
            keyCase: "Bail Act 1976 s.6/s.7",
            principle: "Fail to surrender (s.6): criminal offence (up to 12 months). Breach conditions (s.7): arrestable, brought back to court, bail reconsidered. Absconding aggravates sentence.",
            examTip: "Fail to surrender: offence committed even if reasonable excuse (but defense). Court can issue warrant or adjourn. Breach conditions: arrest without warrant, brought to court. Persistent breaching = likely custody. Reasonable excuse defense (illness, transport failure if tried to attend)."
          }
        ]
      },
      {
        title: "Mode of Trial & Plea",
        topics: [
          {
            name: "Classification of Offences",
            keyCase: "MCA 1980",
            principle: "Summary only: magistrates' only (assault, battery, minor criminal damage ≤£5k). Indictable only: Crown Court only (murder, manslaughter, rape, robbery, s.18 GBH). Either way: defendant can elect (theft, burglary, s.20 GBH, fraud).",
            examTip: "Summary: max 6 months (12 months if two or more either-way). Indictable: no maximum (life for murder). Either way: magistrates decide venue (allocation), defendant elects if accepted. Factors: sentencing powers, complexity, defendant's choice. Youth: always magistrates (Youth Court) unless grave crimes."
          },
          {
            name: "Plea Before Venue & Allocation",
            keyCase: "MCA 1980 ss.17A-20",
            principle: "Either way: plea before venue first. If guilty: magistrates sentence or commit to Crown for sentence. If not guilty: allocation (magistrates decide suitable venue, defendant elects). Crown Court = right to jury trial.",
            examTip: "PBV: defendant indicates plea. Guilty: proceed to sentencing (can commit to Crown if powers insufficient). Not guilty: allocation hearing. Magistrates consider: nature/seriousness, circumstances, own powers sufficient. Accept jurisdiction: defendant elects (magistrates or Crown). Decline: sent to Crown. Election: magistrates = quicker/cheaper/lower sentence, Crown = jury trial."
          },
          {
            name: "Disclosure",
            keyCase: "CPIA 1996",
            principle: "Prosecution: initial disclosure (undermine case or assist defense). Defence: statement (nature of defense, matters in issue, alibi). Prosecution: continuing duty (further material). Failure to disclose = sanctions.",
            examTip: "Initial disclosure: unused material undermining prosecution or assisting defense. Defense statement: Crown Court = mandatory, magistrates = voluntary (but should as triggers further disclosure). Contents: nature of defense, matters in issue, points of law, alibi (notice/particulars). Continuing duty: prosecutor must disclose further material. Failure = abuse of process (stay/exclusion), adverse inference."
          },
          {
            name: "Advance Information & Case Management",
            keyCase: "CrimPR",
            principle: "Magistrates: advance information (prosecution case summary). Crown: served with evidence. Case management: court actively manages. Parties must comply with directions. Overriding objective: cases dealt with justly.",
            examTip: "Advance info (magistrates): before plea. Prosecution case summary (PCS) or full statements. Better Case Management (BCM): early engagement, issues identification. Crown: evidence served, defense statement, PTPH (Plea and Trial Preparation Hearing). Overriding objective: acquit innocent/convict guilty, fair/efficient, proportionate, expedition. Parties' duties: engage, comply, co-operate."
          }
        ]
      },
      {
        title: "Trial Procedure",
        topics: [
          {
            name: "Burden & Standard of Proof",
            keyCase: "Woolmington v DPP [1935]",
            principle: "Prosecution bears burden proving guilt beyond reasonable doubt (Woolmington). Defendant need not prove innocence. Exceptions: defendant proves defense (insanity, diminished responsibility, statutory defenses) on balance of probabilities.",
            examTip: "Golden thread: prosecution proves guilt. Beyond reasonable doubt = sure. Not absolute certainty. Balance of probabilities = more likely than not (51%+). Reverse burden: rare, defendant proves specific defence (insanity, diminished responsibility). Evidential burden: raise issue (defence), legal burden remains on prosecution."
          },
          {
            name: "Evidence - Admissibility",
            keyCase: "PACE 1984 ss.76-78",
            principle: "S.76: confession excluded if obtained by oppression or unreliable (things said/done). S.78: exclude if adverse effect on fairness. Bad character (CJA 2003): generally inadmissible unless gateway applies.",
            examTip: "S.76: oppression = torture, inhuman/degrading, violence. Unreliable: inducement, trick, breach Code C. Burden: prosecution prove not obtained improperly. S.78: discretion, fair trial paramount. Bad character: gateways (agreement, blames another, important explanatory, relevant to important matter, correcting false impression, attacks another's character). Hearsay: generally inadmissible unless exception (CJA 2003)."
          },
          {
            name: "Adverse Inferences",
            keyCase: "CJPOA 1994 ss.34-37",
            principle: "S.34: silence when questioned/charged if later rely on fact (could reasonably have mentioned). S.35: failure to testify. S.36: failure to account for objects/marks. S.37: failure to account for presence. Court may draw proper inferences.",
            examTip: "S.34: 'no comment' interview then defense at trial = inference if fact could reasonably have mentioned. Must have had opportunity for legal advice. Not automatic adverse inference. S.35: defendant can testify or not, but jury can draw inference if doesn't (with judicial direction). Physical/mental condition may explain. Cannot draw if case to answer not made."
          },
          {
            name: "Vulnerable Witnesses - Special Measures",
            keyCase: "YJCEA 1999",
            principle: "Eligible: children, those with mental disorder/learning disability/physical disability, fear/distress. Measures: screens, live link, video evidence, intermediary, communication aids, clearing public gallery.",
            examTip: "Automatic for children (under 18): video interview as evidence-in-chief, live link cross-examination. Adults: apply for special measures if vulnerable/intimidated. Measures: screens (witness can't see defendant), live link (video), video recorded evidence, intermediary (communication), aids, remove wigs/gowns. Ground rules hearing."
          }
        ]
      },
      {
        title: "Sentencing",
        topics: [
          {
            name: "Purposes of Sentencing",
            keyCase: "Sentencing Act 2020 s.57",
            principle: "Five purposes: punishment, reduction of crime (deterrence), reform/rehabilitation, protection of public, reparation. Court must have regard (except murder = mandatory life).",
            examTip: "Punishment: retribution, just deserts. Reduction: general deterrence (others), specific (offender). Reform: help offender change. Protection: public safety, dangerous offenders. Reparation: make amends (compensation, unpaid work). Serious offences: punishment/protection. Minor: reform. Balance depending on offence/offender."
          },
          {
            name: "Sentencing Guidelines",
            keyCase: "Sentencing Council",
            principle: "Court must follow guidelines unless contrary to interests of justice. Guidelines: category (harm/culpability), starting point, range, aggravating/mitigating, reduction for plea. Structured approach.",
            examTip: "Step 1: offence category (harm + culpability). Step 2: starting point + range. Step 3: aggravating factors (previous convictions, vulnerable victim, group, premeditation, weapon). Step 4: mitigating (no previous, remorse, age, mental disorder, good character). Step 5: reduction for plea (max 1/3 if first stage). Totality if multiple offences."
          },
          {
            name: "Custodial Sentences",
            keyCase: "Sentencing Act 2020",
            principle: "Custody only if: so serious only custody justified OR violent/sexual and protection requires. Shortest term commensurate. Immediate or suspended. Credit for time on remand.",
            examTip: "Custody threshold: serious enough that fine/community order cannot be justified. Proportionate: as short as commensurate with seriousness. Immediate: prison now. Suspended: 14 days - 2 years, suspended 6 months - 2 years, requirements possible (unpaid work, curfew, rehab), breach = activate (can reduce). Credit: time on remand counts towards sentence (usually day for day)."
          },
          {
            name: "Community Sentences",
            keyCase: "Sentencing Act 2020",
            principle: "Community order if: serious enough for community order but not custody. Requirements: unpaid work, curfew, exclusion, programme, rehabilitation, mental health, drug/alcohol, residence. Must be suitable/proportionate.",
            examTip: "Threshold: serious enough (not minor fine sufficient). Requirements: one or more. Unpaid work: 40-300 hours. Curfew: 2-16 hours daily, up to 12 months. Rehabilitation: up to 3 years, attend appointments. Combination possible. Breach: fine, more onerous requirements, custody (if wilful/persistent). Length: up to 3 years."
          },
          {
            name: "Financial Penalties",
            keyCase: "Sentencing Act 2020",
            principle: "Fine: based on seriousness. Offence seriousness determines fine band. Court considers means (income/outgoings). Time to pay or instalments. Compensation: priority over fine.",
            examTip: "Fine bands: A (50% weekly income), B (100%), C (150%). Magistrates: max £5k (standard), unlimited (certain offences). Adjust for means: 25-175%. Must inquire into finances. Time to pay: court discretion (usually 14 days or instalments). Non-payment: enforcement (deductions, bailiffs, custody last resort). Compensation: victims first, then prosecution costs, then fine."
          },
          {
            name: "Reduction for Plea",
            keyCase: "Sentencing Council - Reduction for Guilty Plea",
            principle: "Guilty plea: reduction from sentence. Maximum 1/3 if first stage. 1/4 if after trial date set. 1/10 during trial. Applies to custodial, community, fine. Mandatory minimum: can go below.",
            examTip: "First stage (magistrates: before/at first hearing, Crown: PTPH) = 1/3. After trial date set = 1/4. Door of court/during trial = 1/10. Rationale: saves victims, saves resources, shows remorse. Applies: custody (reduce length), community (reduce requirements), fine (reduce amount). Newton hearing: disputed facts, short hearing, impacts sentence."
          }
        ]
      }
    ]
  },
  "Solicitors Accounts": {
    icon: DollarSign,
    color: "green",
    description: "SRA Accounts Rules, Client & Office Money, Double Entry",
    sections: [
      {
        title: "SRA Accounts Rules",
        topics: [
          {
            name: "Client Money vs Office Money",
            keyCase: "SRA Accounts Rules 2019",
            principle: "Client money: held/received for client (includes money held as trustee/stakeholder/agent, advance payments for costs/disbursements). Must keep in client account. Office money: firm's own money. Keep separate.",
            examTip: "Client money: belongs to client/third party. Must hold in separate client account at bank/building society. Cannot mix with office money (breach). Examples: money on account, completion money, damages, stakeholder deposit. Office money: fees earned, money for business expenses. If in doubt = client money (safer). Promptly pay into client account (Rule 2.3)."
          },
          {
            name: "Client Account",
            keyCase: "SRA Accounts Rules Rule 2",
            principle: "Separate account at bank/building society. Name must include 'client account'. Can be separate designated client accounts (SDCA) or general client account. Interest rules apply (Rule 7).",
            examTip: "General client account: pooled, multiple clients. SDCA: separate for one client (large sum, long time). Name: must show solicitor + 'client account'. Cannot use for office money. Interest: if money over £500 and held for 8 weeks or would earn £20+ = account separately and pay to client OR hold in general and account fair sum (Rule 7)."
          },
          {
            name: "Withdrawals from Client Account",
            keyCase: "SRA Accounts Rules Rule 4",
            principle: "Can only withdraw: (a) money properly required for payment on behalf of client/proper fee/disbursement, (b) transfer to another client account, (c) proper and reasonable fees, (d) correct transfer from client to office (inter-account transfer).",
            examTip: "Must have authority: client's instruction or statutory/court obligation or agreed fee arrangement. Cannot withdraw for office expenses (breach). Bill/notification required for fees. If mistake (wrong account): correct by reverse transfer. Example: paid costs from client when should be office = transfer from office to client to correct."
          },
          {
            name: "Reconciliations",
            keyCase: "SRA Accounts Rules Rule 8",
            principle: "Reconcile at least every 5 weeks: compare client ledger balance to bank statement. Identify discrepancies. Keep records. Obligation on COLP/COFA to ensure compliance.",
            examTip: "Five-week rule: reconcile client account and all SDCA. Compare: total client ledger (client side) to bank statement (client account balance). Should match. Discrepancies: investigate immediately (may indicate breach). Records: 6 years. COLP/COFA: responsible for systems. Accountant's report: if hold client money (unless all for Legal Aid), annual report to SRA."
          }
        ]
      },
      {
        title: "Double Entry Bookkeeping",
        topics: [
          {
            name: "Double Entry Principle",
            keyCase: "Fundamental Accounting",
            principle: "Every transaction has two entries: debit and credit. Debit = money coming in (received) or asset increase. Credit = money going out (paid) or liability increase. Debits = Credits (balanced).",
            examTip: "Two sides: debit (left) and credit (right). Money received: debit bank/cash, credit source. Money paid: debit use, credit bank/cash. Client ledger: two sides (debit = money we owe/hold for client, credit = money client owes us). Office ledger: similar. Always: total debits = total credits."
          },
          {
            name: "Client Ledger",
            keyCase: "Accounting Records",
            principle: "Record for each client. Two sides: client account (money we hold) and business account (money client owes firm for costs/disbursements). Debit = money we hold, Credit = money owed to us.",
            examTip: "Client side (left): money we hold for client. Dr = received for client (into client account), Cr = paid on behalf (from client account). Balance = money we hold for client. Business side (right): money client owes firm. Dr = client owes us (bill/disbursement), Cr = client pays us. Balance = client owes firm (or firm owes client if overpaid)."
          },
          {
            name: "Transfers Between Accounts",
            keyCase: "Inter-Account Transfers",
            principle: "Transfer from client to office: when fees earned or disbursements paid by firm. Debit office account (cash), Credit client account (cash). On ledger: Dr client business (they owe), Cr client client (we hold less).",
            examTip: "Common: firm pays disbursement (office money), client reimburses from client account. Entry: Cr client account cash (pay from client), Dr office account cash (receive in office). Ledger: Dr client business (client owes for disbursement paid), Cr client client (money from client account used). Must have authority (bill/notification). Reverse if mistake."
          },
          {
            name: "Petty Cash",
            keyCase: "Cash Transactions",
            principle: "Small cash payments for minor expenses. Keep petty cash book. Receipts required. Reimbursement by cheque from office account (restoring imprest).",
            examTip: "Imprest system: fixed float (e.g., £100). Spend on minor items. Periodically reimburse to restore float. Vouchers: for all payments, attach receipts. Not for client money. Reconcile: cash + vouchers = imprest amount."
          }
        ]
      },
      {
        title: "Practical Transactions",
        topics: [
          {
            name: "Money on Account",
            keyCase: "Advance Payments",
            principle: "Client pays money in advance for future costs/disbursements. Hold in client account until fees incurred or disbursements paid. Transfer to office when bill delivered.",
            examTip: "Money on account = client money. Dr: client bank/client cash (received into client account). Cr: client client (we hold for client). When bill: Dr client business (client owes for bill), Cr profit costs (firm earns). Transfer to office: Dr office cash (transfer in), Cr client cash (transfer out). Ledger: Dr client business, Cr client client."
          },
          {
            name: "Completion of Purchase",
            keyCase: "Property Transaction",
            principle: "Buyer: receives mortgage advance (client money), deposit from client (client money), pays purchase price + SDLT. Seller: receives purchase price (client money), pays estate agent/mortgage redemption.",
            examTip: "Buyer entries: receive mortgage advance (Dr client cash, Cr client client - hold for client). Pay purchase price (Dr client client - use client money, Cr client cash - pay out). SDLT: firm pays from office (Dr client business - client owes, Cr office cash - firm pays). Transfer from client later. Seller: receive price (Dr client cash, Cr client client), pay redemption (Dr client client, Cr client cash)."
          },
          {
            name: "Damages Received",
            keyCase: "Client Funds",
            principle: "Damages received for client = client money. Hold in client account. Deduct costs (transfer to office). Pay balance to client. Keep proper records.",
            examTip: "Receive damages: Dr client cash (into client account), Cr client client (hold for client). Deduct costs: transfer to office (Dr office cash, Cr client cash; ledger: Dr client business, Cr client client). Pay client: Dr client client (reduce holding), Cr client cash (pay out). If already billed: transfer against bill. If not: bill then transfer."
          },
          {
            name: "Stakeholder Deposit",
            keyCase: "Property Transactions",
            principle: "Deposit held by solicitor as stakeholder (neutral). Stakeholder money = client money. Hold until completion or contractual terms allow release. Cannot release without authority (buyer + seller or court).",
            examTip: "Stakeholder: hold for both parties. Client money even though not your client. Receive: Dr client cash, Cr client client (named 'Stakeholder - [Property]'). Release: need authority both parties or contract terms satisfied. If dispute: interpleader (pay into court). Agent: can release to seller (different from stakeholder)."
          }
        ]
      }
    ]
  },
  "Constitutional & Administrative Law": {
    icon: Landmark,
    color: "blue",
    description: "Parliamentary Sovereignty, Rule of Law, Separation of Powers & JR",
    sections: [
      {
        title: "Fundamental Principles",
        topics: [
          {
            name: "Parliamentary Sovereignty",
            keyCase: "A.V. Dicey",
            principle: "Parliament can make/unmake any law. No parliament can bind successor. Courts cannot override/strike down Acts. Challenged by: EU membership (past), devolution, HRA 1998, common law constitutionalism.",
            examTip: "Three aspects: (1) Parliament can legislate on any subject, (2) no legal limits on content, (3) no person/body can override legislation. Challenges: EU (supremacy while member - now post-Brexit), HRA (courts declare incompatibility but cannot strike down), Jackson (obiter - limits if Parliament abolishes judicial review?). Enrolled Bill Rule: courts don't look behind Act (manner/form)."
          },
          {
            name: "Rule of Law",
            keyCase: "A.V. Dicey",
            principle: "Three meanings: no arbitrary power (government under law), equality before law, constitution is result of ordinary law. Modern: legal certainty, access to justice, substantive rights.",
            examTip: "Dicey's rule of law: government under law, equality, rights from common law. Modern additions: legal certainty (laws clear, prospective, accessible), access to justice (courts accessible), procedural propriety (fair hearings), substantive rights (fundamental rights respected). Tensions: parliamentary sovereignty vs rule of law (courts increasingly assertive - Privacy International)."
          },
          {
            name: "Separation of Powers",
            keyCase: "Montesquieu",
            principle: "Legislature (Parliament), Executive (Government), Judiciary (Courts) separate to prevent tyranny. UK: fusion of Legislature and Executive (Cabinet from Parliament). Judicial independence strong (CRA 2005).",
            examTip: "Not pure separation: PM + Cabinet are MPs/Lords (fusion). Legislature: makes law (Parliament). Executive: implements/administers (Government). Judiciary: interprets/applies (Courts). Checks/balances: judiciary reviews executive (JR), Parliament scrutinizes government. CRA 2005: Supreme Court, Lord Chancellor no longer judge, Judicial Appointments Commission."
          }
        ]
      },
      {
        title: "Parliament",
        topics: [
          {
            name: "Composition",
            keyCase: "Parliament Acts 1911/1949",
            principle: "House of Commons (elected, 650 MPs), House of Lords (appointed, hereditary peers reduced, life peers), Monarch (formal only). Commons primacy. Lords can delay (not block) money/public bills.",
            examTip: "Commons: elected, 5-year max (FTPA 2011 repealed by DPCTA 2022 - back to prerogative dissolution), constituencies. Lords: unelected, life peers (appointed by PM), 92 hereditary, 26 bishops. Monarch: gives Royal Assent (never refused since 1707 - convention). Parliament Acts: Lords delay 1 year (not block), money bills 1 month. Salisbury Convention: Lords don't oppose manifesto bills."
          },
          {
            name: "Legislation Process",
            keyCase: "Parliament Act 1911",
            principle: "Public Bill procedure: First Reading (formal), Second Reading (debate principles), Committee Stage (line-by-line), Report Stage (amendments), Third Reading (final), Lords (same stages), Royal Assent.",
            examTip: "Public: government or private member. Private: local/personal. Stages: 1st R (formality), 2nd R (debate/vote), Committee (scrutiny - whole House or Public Bill Committee), Report (amendments), 3rd R (final debate), Lords (same unless Commons financial), Royal Assent (formality). Ping-pong: if Lords amend, back to Commons. Parliament Acts: bypass Lords if rejects twice."
          },
          {
            name: "Parliamentary Privilege",
            keyCase: "Bill of Rights 1689",
            principle: "Freedom of speech: proceedings in Parliament cannot be questioned in courts (Art IX Bill of Rights). Exclusive cognizance: Parliament regulates own proceedings. Penal jurisdiction: punish contempt.",
            examTip: "Art IX: freedom of speech in Parliament. Cannot be sued for defamation for what said in Parliament. Courts cannot question proceedings (Pepper v Hart exception: consult Hansard for ambiguous legislation). Exclusive cognizance: each House controls own procedure (courts no jurisdiction - R (Miller) v PM - but courts can review if affects legal rights). Contempt: House can punish breaches (rarely used)."
          }
        ]
      },
      {
        title: "Executive & Prerogative",
        topics: [
          {
            name: "Royal Prerogative",
            keyCase: "Case of Proclamations [1611]",
            principle: "Residual common law powers of Crown. Cannot create new prerogatives. Can be abolished by statute. Exercised by government (PM/ministers) by convention. Subject to judicial review (GCHQ).",
            examTip: "Residual powers: remains of monarch's historic powers. Categories: foreign affairs (treaties, diplomacy), defense (armed forces), justice (mercy, pardon), government (appoint ministers, prorogue/dissolve Parliament). Limits: cannot create crimes/taxes, cannot conflict with statute (prerogative yields - De Keyser). Reviewable: GCHQ - courts review exercise (not existence/extent). Non-justiciable: some areas (dissolution, honors, treaties)."
          },
          {
            name: "Conventions",
            keyCase: "Attorney General v Jonathan Cape [1976]",
            principle: "Non-legal rules of constitutional behavior. Not enforced by courts but politically binding. Examples: Royal Assent, ministerial responsibility, Salisbury Convention, Sewel Convention.",
            examTip: "Conventions = constitutional rules but not laws. Not enforced by courts (political/moral obligation). Key: Monarch acts on PM advice, Royal Assent always given, individual ministerial responsibility (resign if serious error), collective ministerial responsibility (Cabinet solidarity), Salisbury (Lords don't block manifesto), Sewel (Westminster legislates for devolved matters only with consent). Codification debate."
          },
          {
            name: "Ministerial Responsibility",
            keyCase: "Constitutional Conventions",
            principle: "Individual: ministers responsible for department, resign if serious error/misleading Parliament. Collective: Cabinet collective decision, public solidarity, resign if disagree (or reshuffled if PM loses confidence).",
            examTip: "Individual: minister responsible for own conduct + department. Resign if: mislead Parliament, serious personal misconduct, serious departmental failure (rare unless personal involvement). Collective: Cabinet discusses in private, collective decision, public solidarity, dissent = resign (or PM dismisses). Confidence vote: if lose, government resigns or seeks dissolution. VONC in government: FTPA 2011 (14 days alternative government) repealed."
          }
        ]
      },
      {
        title: "Judicial Review - Grounds",
        topics: [
          {
            name: "Illegality",
            keyCase: "Council of Civil Service Unions v Minister for Civil Service [1985] (GCHQ)",
            principle: "Decision-maker misunderstands law/acts beyond powers. Includes: simple ultra vires, error of law, relevant/irrelevant considerations, improper purpose, unlawful delegation, fettering discretion.",
            examTip: "Simple ultra vires: outside statutory power (Anisminic - jurisdictional error of law). Error of law: misinterpret statute. Relevant considerations: must consider relevant, not irrelevant (Padfield). Improper purpose: use power for wrong reason (Congreve - TV licenses). No delegation: cannot delegate unless authorized (Carltona exception - civil servant acts for minister). No fettering: cannot adopt rigid policy (British Oxygen - but policy + exceptions OK)."
          },
          {
            name: "Procedural Impropriety",
            keyCase: "Ridge v Baldwin [1964]",
            principle: "Breach of statutory procedure or common law natural justice. Natural justice: right to fair hearing (audi alteram partem), rule against bias (nemo iudex in causa sua).",
            examTip: "Statutory: must comply with statute (mandatory vs directory - London & Clydeside). Natural justice: two rules. (1) Fair hearing: notice, opportunity to make representations, reasons (limited - Doody), legal representation (depends - Osborn). (2) No bias: actual (automatic disqualification), apparent (fair-minded observer test - Porter v Magill). Waiver possible. Legitimate expectation: if promise/practice, may require consultation before change (Coughlan)."
          },
          {
            name: "Irrationality (Wednesbury Unreasonableness)",
            keyCase: "Associated Provincial Picture Houses v Wednesbury Corp [1948]",
            principle: "Decision so unreasonable no reasonable authority could reach it. Very high threshold. Also: proportionality test (if human rights engaged - structured, less deferential).",
            examTip: "Wednesbury: absurd/perverse/outrageous decision (very high bar). No merit review (not is decision right, but is it irrational). Courts defer to expertise. Proportionality: if HRA engaged, lower threshold - (1) legitimate aim? (2) suitable? (3) necessary? (4) balance fair? (Pham, Keyu). Anxious scrutiny: higher intensity review if fundamental rights (Bugdaycay)."
          }
        ]
      },
      {
        title: "Judicial Review - Procedure & Remedies",
        topics: [
          {
            name: "Standing & Time Limits",
            keyCase: "R v IRC ex p National Federation of Self-Employed [1982]",
            principle: "Standing: sufficient interest test (s.31(3) SCA 1981). Liberal approach (pressure groups often have standing if genuine concern). Time limit: promptly and in any event within 3 months. Planning: 6 weeks.",
            examTip: "Sufficient interest: claimant must show real/genuine interest (not busybody). Individuals: directly affected. Pressure groups: depends (genuine concern, no other challenger, vindicate rule of law). Amnesty International, Greenpeace succeeded. Time: promptly + within 3 months (strict - courts won't extend easily). Planning/procurement: 6 weeks. Good reason needed for delay. Undue delay = prejudice/detrimental."
          },
          {
            name: "Remedies",
            keyCase: "CPR 54",
            principle: "Quashing order (quash decision), mandatory order (compel action), prohibiting order (prevent action), declaration (clarify law), injunction (interim/final), damages (if tort claim included).",
            examTip: "Discretionary: court can refuse even if grounds made out (delay, alternative remedy, futility, acquiescence). Quashing: most common, sets aside unlawful decision. Mandatory: compel public body act (rare). Prohibiting: prevent (rare). Declaration: clarify legal position. Damages: only if private law claim (tort) also. Interim relief: urgency, serious issue, balance of convenience, damages inadequate."
          },
          {
            name: "Exclusion of Judicial Review",
            keyCase: "Anisminic v Foreign Compensation Commission [1969]",
            principle: "Ouster clauses (no court review) strictly construed. Total ouster rare (Parliament must use clear words). Courts distinguish: review of decision vs review of jurisdiction. Nullity can still review.",
            examTip: "Ouster clause: 'decision shall not be questioned'. Courts construe narrowly. Anisminic: if decision nullity (outside jurisdiction), clause doesn't apply. Total ouster: must be unmistakably clear. Time-limit clauses: usually OK (6 weeks planning). Cart: unappealable UT decisions limited JR (second-tier appeals require compelling reason). Privacy International: review of review system (courts protective of JR jurisdiction)."
          }
        ]
      },
      {
        title: "Human Rights Act 1998",
        topics: [
          {
            name: "Structure & Convention Rights",
            keyCase: "HRA 1998",
            principle: "Incorporates ECHR into UK law. Public authorities must act compatibly (s.6). Courts interpret legislation compatibly (s.3). Declaration of incompatibility (s.4) if cannot. Horizontal effect limited.",
            examTip: "S.3: interpret legislation compatibly 'so far as possible'. Very strong (Ghaidan - read in/out words). Limits: cannot go against grain (Bellinger - sex change). S.4: if cannot interpret compatibly, declare incompatibility (Parliament free to amend or not). S.6: unlawful for public authority breach Convention rights (unless statute requires - s.6(2)). Public authority: core (government, police) or functional (private if public functions). Damages: just satisfaction."
          },
          {
            name: "Key Convention Rights",
            keyCase: "ECHR Articles",
            principle: "Art 2 (life), Art 3 (torture/inhuman treatment - absolute), Art 5 (liberty), Art 6 (fair trial), Art 8 (private/family life), Art 9 (religion), Art 10 (expression), Art 11 (assembly), Art 14 (discrimination - parasitic), Protocol 1 Art 1 (property).",
            examTip: "Absolute: Art 2, 3 (no derogation/limitation). Limited: Art 5 (prescribed grounds). Qualified: Art 8, 9, 10, 11 (interference if: in accordance with law, legitimate aim, necessary in democratic society - proportionate). Positive obligations: state must protect rights (Art 2 - life, Art 3 - torture, Art 8 - private life). Derogation: war/emergency (Art 15) - must be strictly necessary. A and others: indefinite detention derogation invalid (discriminatory)."
          }
        ]
      }
    ]
  },
  "Legal Services": {
    icon: Users,
    color: "purple",
    description: "SRA Standards, Professional Conduct, Accounts & Regulatory Framework",
    sections: [
      {
        title: "SRA Standards & Regulations",
        topics: [
          {
            name: "SRA Principles",
            keyCase: "SRA Principles 2019",
            principle: "Seven Principles: (1) justice/rule of law, (2) public trust, (3) independence, (4) honesty, (5) integrity, (6) equal/fair/diverse, (7) best interests of client. Apply to all.",
            examTip: "Principles override. All solicitors/firms must uphold. (1) Uphold justice and rule of law. (2) Maintain public trust. (3) Independence (don't compromise). (4) Honesty. (5) Integrity. (6) Equality, diversity, inclusion. (7) Act in best interests (but Principles 1-2 may override). Conflicts: Principles 1-2 > Principle 7 (client). Used to assess serious breaches."
          },
          {
            name: "SRA Code of Conduct for Solicitors",
            keyCase: "SRA Code 2019",
            principle: "Standards for individual solicitors and RELs. Covers: competence, service, conflicts, confidentiality, cooperation, disputes. Outcomes-focused (not prescriptive). Indicative behaviors.",
            examTip: "Competence: maintain (para 3.2). Service: proper standard (3.2). Confidentiality: protect (6.3, 6.4, 6.5). Conflicts: don't act if conflict/significant risk (6.1). Cooperation: SRA, ombudsman, other regulators (7.1). Fees: best info possible (8.7). Referrals: disclose if receive fee (5.1). Client money: comply Accounts Rules."
          },
          {
            name: "SRA Code of Conduct for Firms",
            keyCase: "SRA Code for Firms 2019",
            principle: "Applies to firms (not individuals). Governance, management, PII, complaints, price transparency, client money. COLP/COFA obligations.",
            examTip: "Governance: arrangements ensure comply (para 2.1). COLP: Compliance Officer for Legal Practice. COFA: Compliance Officer for Finance and Administration. PII: adequate and appropriate insurance (9.1). Complaints procedure: in place, in writing, client aware (8.2-8.5). Price transparency: publish (8.6-8.7). Client money: protect (10.1), comply Accounts Rules."
          },
          {
            name: "Confidentiality & Disclosure",
            keyCase: "SRA Code 6.3-6.5",
            principle: "Keep client affairs confidential (6.3). Disclose if: client consent, law requires, prevent death/serious harm. Don't misuse confidential info (6.4). Don't act if knowledge confidential info of former client conflicts with current (6.5).",
            examTip: "Confidentiality: fundamental duty. Exceptions: client consent, legal obligation (money laundering, court order), prevent death/serious harm. Client cannot waive privilege (court decides). Conflict: if confidential info from A conflicts with duties to B, cannot act for B. Limited retainer possible if informed consent + safeguards. Chinese wall rarely sufficient solicitor level."
          }
        ]
      },
      {
        title: "Conflicts of Interest",
        topics: [
          {
            name: "Own Interest Conflict",
            keyCase: "SRA Code 6.1",
            principle: "Cannot act if own interest conflict with client or significant risk of conflict. Rare exceptions (own client or conveyancing with safeguards).",
            examTip: "Own interest: your personal interests vs client's. E.g., lending money to client, sexual relationship, financial interest in transaction. Cannot act (principle). Exceptions: (1) lending institutions policy, (2) conveyancing where buying/selling to client (price independently verified, client advised independent legal advice). Always risky."
          },
          {
            name: "Client Conflict",
            keyCase: "SRA Code 6.2",
            principle: "Cannot act for two clients if conflict or significant risk. Exceptions: (1) both clients competing for same asset (certain conditions), (2) substantially common interest (certain conditions), (3) agreed terms (both lenders on same asset).",
            examTip: "Two clients, interests conflict. Examples: buyer + seller, opposing parties litigation, two lenders on same property (different terms). Cannot act. Exceptions: (1) Competing: both want same asset (house, company), clients separately represented + gave informed consent. (2) Common interest: clear common purpose (joint purchase, commercial collaboration), no conflict on how achieve, separately represented, consent. (3) Lender terms: multiple lenders on same asset, agreed terms, consent."
          },
          {
            name: "Information Barriers (Chinese Walls)",
            keyCase: "SRA Guidance",
            principle: "Can use information barriers if: clients not individuals, reasonable safeguards, no significant risk of confidential info disclosure, client consent. Cannot rely if act in same matter.",
            examTip: "Chinese wall: physical/digital separation between teams. Requirements: clients must be sophisticated (not individuals), effective information barrier, no real risk info passes, informed consent. Examples: different offices, separate servers, no joint meetings, confidentiality agreements. Cannot use: same matter, individual clients (too risky). Use rare (alternative: decline to act)."
          }
        ]
      },
      {
        title: "Money Laundering & Financial Crime",
        topics: [
          {
            name: "Money Laundering Offences",
            keyCase: "Proceeds of Crime Act 2002 ss.327-329",
            principle: "Three offences: s.327 (concealing), s.328 (arrangements), s.329 (acquisition/use/possession). Criminal property = proceeds of crime. Defenses: authorized disclosure (SAR), privilege.",
            examTip: "S.327: conceal/disguise/convert/transfer/remove criminal property. S.328: enter arrangement knowing/suspecting facilitates acquisition/retention/use/control of criminal property. S.329: acquire/use/possess criminal property. Mens rea: know/suspect (s.328, 329) or should know (s.327 - negligence if professional). Defense: authorized disclosure = Suspicious Activity Report (SAR) to MLRO/NCA before act + appropriate consent."
          },
          {
            name: "Client Due Diligence (CDD)",
            keyCase: "Money Laundering Regulations 2017",
            principle: "Must conduct CDD when: establish business relationship, carry out occasional transaction (€15k+), suspect money laundering, doubt previously obtained info. CDD: identify and verify client (and beneficial owner if applicable).",
            examTip: "CDD: verify identity (passport/driving license + proof address - utility bill, bank statement). Timing: before establish relationship (risk-based can be during if low risk). Beneficial owner: if client is company, identify individuals with >25% shares/voting/control. Enhanced due diligence: high-risk (PEP - politically exposed person, high-risk country, complex structure). Simplified: low risk (EU regulated firm). Record: 5 years."
          },
          {
            name: "Suspicious Activity Reports (SARs)",
            keyCase: "POCA 2002 s.330-331",
            principle: "Must report to MLRO/NCA if know/suspect money laundering. Regulated sector: s.330 (failure to disclose = offence if know/suspect/reasonable grounds suspect). Privileged communications: exemption.",
            examTip: "SAR: report to MLRO (firm) or NCA (sole). Threshold: know/suspect or reasonable grounds to suspect. Regulated sector offence (s.330): failure to report if should know. Privilege: legal professional privilege communications exempt (but not if furthering crime - crime/fraud exception). Consent: after SAR, wait 7 days (notice period), can act if consent or 31 days pass without refusal. Tipping off (s.333): do not inform client/others of SAR (offence unless legal advice)."
          }
        ]
      }
    ]
  },
  "EU Law": {
    icon: Globe,
    color: "cyan",
    description: "Supremacy, Direct Effect, Free Movement & State Aid (Historical Context)",
    sections: [
      {
        title: "Fundamental Principles (Pre-Brexit)",
        topics: [
          {
            name: "Supremacy of EU Law",
            keyCase: "Costa v ENEL [1964]",
            principle: "EU law supreme over conflicting national law (Costa). Member states cannot unilaterally override EU law. National courts must disapply conflicting national law (Simmenthal). UK: European Communities Act 1972 gave effect (now repealed post-Brexit).",
            examTip: "Costa: EU law prevails. Simmenthal: national courts must disapply conflicting national law (no need wait for repeal). Factortame: even constitutional principles (parliamentary sovereignty) cannot override EU law while member. Post-Brexit: EU law no longer supreme in UK (retained EU law). Supremacy was cornerstone of EU membership."
          },
          {
            name: "Direct Effect - Vertical & Horizontal",
            keyCase: "Van Gend en Loos [1963]",
            principle: "Direct effect: EU provision creates individual rights enforceable in national courts. Requirements: clear, precise, unconditional. Vertical (individual vs state), horizontal (individual vs individual). Treaty articles, regulations, some directives (vertical only), decisions.",
            examTip: "Van Gend: treaty articles can have direct effect. Vertical: against state/emanation of state (Marshall - NHS = state). Horizontal: between individuals. Treaty/regulations: vertical + horizontal. Directives: vertical only (cannot impose obligations on individuals - Duke v GEC). Test: clear, precise, unconditional, no further action needed. If not directly effective, try indirect effect (Marleasing - interpret national law consistently)."
          },
          {
            name: "Indirect Effect & Supremacy",
            keyCase: "Marleasing [1990]",
            principle: "Indirect effect: national courts must interpret national law consistently with EU law (Marleasing) 'so far as possible'. Applies even if directive not directly effective. Limits: cannot impose criminal liability, cannot contradict clear national law (Wagner Miret).",
            examTip: "Marleasing: interpret national law to achieve directive's result. Strong interpretative obligation (similar to HRA s.3). Limits: contra legem (against grain of legislation) not required. Criminal liability: cannot extend/create crimes by interpretation. Pre/post directive national law = both interpreted consistently. If cannot: state liability (Francovich)."
          },
          {
            name: "State Liability (Francovich)",
            keyCase: "Francovich v Italy [1991]",
            principle: "Member state liable in damages for breach of EU law. Requirements: (1) right conferred on individuals, (2) breach sufficiently serious, (3) causal link. National courts determine remedy following national procedural rules (but must be effective).",
            examTip: "Francovich: if directive not implemented/wrongly implemented and not directly effective, sue state for damages. Three conditions all required. Sufficiently serious: clear disregard of discretion limits (Brasserie du Pêcheur). Applies: legislature, executive, judiciary. National rules on damages apply (equivalence + effectiveness). Cannot exclude state liability (Kobler)."
          }
        ]
      },
      {
        title: "Free Movement of Goods",
        topics: [
          {
            name: "Customs Union & Prohibitions",
            keyCase: "TFEU Arts 28-30",
            principle: "Customs union: no customs duties between members, common external tariff. Art 30: prohibition of customs duties on imports/exports. Art 110: no discriminatory internal taxation. Charges having equivalent effect (CEE) prohibited.",
            examTip: "Art 30: absolute prohibition (no exceptions). CEE: any charge imposed by reason of goods crossing border (Commission v Italy - statistical levy). Exceptions: genuine service rendered (Bresciani - vet inspection if proportionate), internal tax (Art 110). Art 110: cannot tax imported goods more than similar domestic (discriminatory) or protect domestic (protective)."
          },
          {
            name: "QRs & MEQRs",
            keyCase: "Dassonville [1974] / Cassis de Dijon [1979]",
            principle: "Art 34: prohibition of quantitative restrictions (QRs - quotas/bans) and measures equivalent (MEQRs). Dassonville: all trading rules capable of hindering trade directly/indirectly, actually/potentially = MEQR. Exceptions: Art 36 (mandatory requirements).",
            examTip: "Dassonville formula: very wide (any rule hindering trade). Applies: discriminatory + indistinctly applicable. Cassis: rule of reason (mandatory requirements) - public health, consumer protection, fair trading, environmental. Must be proportionate, no less restrictive means, not arbitrary discrimination. Art 36: exhaustive list (public morality, policy, security, health, national treasures, IP). Keck: selling arrangements not MEQRs if apply equally in law/fact and affect all traders."
          },
          {
            name: "Derogations - Art 36 & Cassis",
            keyCase: "Art 36 TFEU / Cassis de Dijon",
            principle: "Art 36: derogations from Art 34 (public morality, policy, security, health, protection national treasures, IP). Proportionate, no arbitrary discrimination, no disguised restriction. Cassis: mandatory requirements (rule of reason) for indistinctly applicable.",
            examTip: "Art 36: exhaustive list (cannot add). Burden on member state. Narrow interpretation. Examples: public health (Rewe - phytosanitary inspection proportionate), public morality (Henn & Darby - pornography if internal measures too). Cannot use economic grounds. Cassis mandatory requirements: non-exhaustive, only indistinctly applicable measures, includes consumer protection, fair trading, environmental. Proportionality key."
          }
        ]
      },
      {
        title: "Free Movement of Workers & Services",
        topics: [
          {
            name: "Workers - Art 45",
            keyCase: "Lawrie-Blum [1986]",
            principle: "Worker: performs services for/under direction of another, receives remuneration, genuine/effective economic activity. Rights: enter, reside, work, equal treatment (employment/social advantages). Family rights (Directive 2004/38). Public service exception (Art 45(4)).",
            examTip: "Worker definition: Lawrie-Blum - subordinate relationship, remuneration (Steymann - payments in kind OK), genuine/effective (Levin - part-time OK, Kempf - supplemented by benefits OK, Bettray - sheltered work not genuine). Rights: no discrimination nationality, equal access jobs, equal treatment (working conditions, social advantages). Public service exception: core state functions (police, armed forces) not all public employment."
          },
          {
            name: "Services - Art 56",
            keyCase: "Van Binsbergen [1974]",
            principle: "Services: normally provided for remuneration, temporary, not covered by other freedoms. Provider/recipient can rely. Prohibition: restrictions on provision. Exceptions: imperative requirements (public interest), proportionate.",
            examTip: "Services = residual freedom (if not goods, workers, establishment). Examples: banking, insurance, legal services, tourism, medical. Temporary = distinguishes from establishment (habitual/permanent). Recipient freedom: travel for services (Cowan - tourist). Restrictions: discriminatory or indistinctly applicable rules hindering. Justifications: official authority exception (Art 62 - core state powers), imperative requirements (Gebhard: public interest, non-discriminatory, suitable, proportionate)."
          },
          {
            name: "Establishment - Art 49",
            keyCase: "Reyners [1974]",
            principle: "Establishment: right to set up/pursue self-employed activity on stable/continuous basis in another member state. Primary (move and set up) or secondary (branch/agency/subsidiary). Prohibition: restrictions based on nationality. Exceptions: official authority, imperative requirements.",
            examTip: "Establishment vs services: stable/continuous (establishment), temporary (services). Includes: natural persons (self-employed), companies (registered office/central admin/principal place of business in EU). Gebhard: national measures liable to hinder exercise, must be: justified (imperative requirements), apply without discrimination, suitable, necessary (proportionate). Official authority: core state functions (limited - Reyners - lawyers not official authority)."
          },
          {
            name: "Recognition of Qualifications",
            keyCase: "Directive 2005/36/EC",
            principle: "Mutual recognition of qualifications. General system: if substantial difference, compensatory measures (adaptation period or aptitude test). Automatic recognition for certain professions (doctors, nurses, lawyers). Host state must recognize if qualification equivalent.",
            examTip: "Directive 2005/36: consolidated previous directives. General system: Level A (diploma - 3+ years), Level B (certificate - 1-2 years), Level C (school). If substantial difference: compensation (adaptation period = supervised practice, aptitude test = knowledge test, applicant chooses unless prescribed profession). Automatic recognition: Annex V professions (doctors, dentists, pharmacists, nurses, midwives, architects, vets). Lawyers: Establishment Directive 98/5 (home title or integrate)."
          }
        ]
      },
      {
        title: "Competition & State Aid",
        topics: [
          {
            name: "Art 101 TFEU - Agreements",
            keyCase: "Art 101 TFEU",
            principle: "Prohibits agreements between undertakings which restrict competition and affect trade between member states. Void if infringed. Exemptions: Art 101(3) (improves production/distribution, fair share consumers, indispensable, no eliminate competition) or block exemption regulations.",
            examTip: "Elements: (1) undertaking (any entity engaged in economic activity), (2) agreement/concerted practice/decision by association, (3) object/effect restriction of competition, (4) affect trade between member states. Examples: price-fixing, market sharing, limiting production. De minimis: negligible effect (market share thresholds). Exemptions: 101(3) individual (four conditions cumulative) or block exemptions (vertical agreements, tech transfer, R&D)."
          },
          {
            name: "Art 102 TFEU - Abuse of Dominance",
            keyCase: "Art 102 TFEU",
            principle: "Prohibits abuse by dominant undertaking of dominant position within internal market/substantial part. Not illegal to be dominant, only abuse. Examples: unfair prices, limiting production, discrimination, tying.",
            examTip: "Elements: (1) undertaking, (2) dominant position (ability to behave independently - United Brands), (3) substantial part internal market (geographic), (4) abuse. Dominance: market share 40%+ relevant, 50%+ presumption (AKZO). Relevant market: product market (substitutability - demand side, supply side) + geographic market. Abuse: exploitative (excessive pricing - United Brands) or exclusionary (predatory pricing, refusal to supply, rebates, tying)."
          },
          {
            name: "State Aid - Art 107 TFEU",
            keyCase: "Art 107 TFEU",
            principle: "State aid incompatible with internal market if: (1) granted by member state/state resources, (2) favors certain undertakings/production, (3) distorts competition, (4) affects trade between member states. Exceptions: Art 107(2)-(3). Must notify Commission.",
            examTip: "State aid = selective advantage (not general measures). Examples: grants, subsidies, tax breaks, soft loans, guarantees. All four elements required. Selectivity: only certain undertakings (not general applicable to all). Notification: must notify before implement (standstill). If unlawful: recovery. Exemptions: 107(2) automatic (natural disasters, divided Germany), 107(3) discretionary (regional aid, important European project, culture). De minimis: €200k over 3 years."
          }
        ]
      }
    ]
  },
  "The Legal System of England & Wales": {
    icon: Landmark,
    color: "slate",
    description: "Courts Structure, Sources of Law, Judiciary & Legal Profession",
    sections: [
      {
        title: "Courts Structure",
        topics: [
          {
            name: "Civil Courts Hierarchy",
            keyCase: "Courts structure",
            principle: "Supreme Court (final appeal), Court of Appeal (Civil Division), High Court (QB, Chancery, Family), County Court (first instance most civil). Tribunals (specialist). UKSC replaced House of Lords 2009 (CRA 2005).",
            examTip: "High Court divisions: QB (contract, tort, commercial, admiralty), Chancery (property, trusts, companies, IP, tax), Family (matrimonial, children). County Court: unlimited jurisdiction (most civil claims start here unless value/complexity). Leapfrog appeal: High Court direct to UKSC if point of law of public importance (rare). Small claims track in County Court (≤£10k)."
          },
          {
            name: "Criminal Courts Hierarchy",
            keyCase: "Courts structure",
            principle: "Supreme Court (final appeal points of law public importance), Court of Appeal (Criminal Division), Crown Court (trial indictable/either way, appeals from magistrates), Magistrates' Court (summary, either way, youth, committals). High Court (QB Divisional Court - judicial review criminal).",
            examTip: "Magistrates: summary only + either way if accepted jurisdiction, committals for sentence/trial, bail decisions, youth court. Crown Court: indictable only + either way if elected/committed, appeals from magistrates (sentence/conviction). Court of Appeal: appeals from Crown Court (permission needed). UKSC: points of law of general public importance, permission needed. QBD judicial review: challenges to magistrates/Crown Court decisions."
          },
          {
            name: "Tribunals System",
            keyCase: "Tribunals, Courts and Enforcement Act 2007",
            principle: "Two-tier: First-tier Tribunal (7 chambers - Social Entitlement, Health/Education/Social Care, War Pensions, General Regulatory, Tax, Immigration/Asylum, Property), Upper Tribunal (4 chambers). Appeals: UT, Court of Appeal, Supreme Court.",
            examTip: "Purpose: specialist, cheaper, quicker, less formal than courts. First-tier: initial hearing (most cases). Upper Tribunal: appeals from First-tier (error of law), judicial review (some). Chambers: specialist jurisdiction. Legal representation not required (but common in complex). Appeals: permission needed (error of law only). UT decisions = High Court status (precedent)."
          }
        ]
      },
      {
        title: "Sources of Law",
        topics: [
          {
            name: "Legislation - Acts of Parliament",
            keyCase: "Parliamentary sovereignty",
            principle: "Primary legislation = Acts of Parliament. Supreme source (parliamentary sovereignty). Interpretation: literal, golden, mischief (Heydon's case), purposive. Aids: intrinsic (long title, preamble, headings), extrinsic (Hansard if ambiguous - Pepper v Hart).",
            examTip: "Literal rule: ordinary meaning of words. Golden rule: modify if absurd result (narrow application). Mischief rule (Heydon's case): what mischief Act intended to remedy? Purposive: look at purpose (modern, EU influence). Pepper v Hart: consult Hansard if ambiguous and clear ministerial statement. Presumptions: against retrospective effect, against ousting courts, in favor of individual liberty."
          },
          {
            name: "Delegated Legislation",
            keyCase: "Parent Act authority",
            principle: "Secondary legislation: Statutory Instruments (Orders in Council, regulations), bylaws, Orders. Made under authority of parent Act. Subject to judicial review (ultra vires if exceeds powers). Parliamentary scrutiny: affirmative (both Houses approve) or negative (can annul).",
            examTip: "SI most common. Ultra vires if: substantive (exceeds powers granted), procedural (fails to follow procedure), unreasonable (Wednesbury). Advantages: quick, flexible, expert input, saves parliamentary time. Disadvantages: less democratic scrutiny, volume overwhelming, complex/inaccessible. Henry VIII clause: allows SI to amend primary legislation (controversial)."
          },
          {
            name: "Case Law - Precedent",
            keyCase: "Doctrine of precedent",
            principle: "Binding precedent: ratio decidendi (reason for decision) of higher court binds lower. Obiter dicta (things said by the way) persuasive only. Hierarchy: UKSC binds all, Court of Appeal binds HC/itself (exceptions: Young v Bristol Aeroplane), High Court binds lower, not self.",
            examTip: "Ratio = binding. Obiter = persuasive. UKSC: Practice Statement 1966 (can depart from own previous if appear right - rare). Court of Appeal: Young exceptions - (1) conflicting CA decisions, (2) UKSC overruled, (3) per incuriam. Distinguishing: material facts different (not bound). Overruling: higher court says lower wrong (prospective). Reversing: appeal court reverses lower in same case."
          },
          {
            name: "EU Law & Retained EU Law",
            keyCase: "European Union (Withdrawal) Act 2018",
            principle: "Pre-Brexit: EU law supreme (Costa, Factortame). Post-Brexit: EU law ceased apply 31 Dec 2020 (transition). Retained EU law (REUL): EU-derived domestic legislation, direct EU legislation, rights from EU law. Supremacy ended. Can now amend/repeal.",
            examTip: "REUL categories: (1) EU-derived domestic legislation (UK law implementing EU - regulations, directives), (2) direct EU legislation (EU regulations/decisions saved), (3) rights arising from EU treaties before exit. Status: like domestic legislation, no longer supreme. Interpretation: retained case law (CJEU decisions before exit) - courts not bound but can consider. UK can now diverge. Retained EU Law (Revocation and Reform) Act 2023: sunset clause (most REUL expired unless saved)."
          }
        ]
      },
      {
        title: "Judiciary",
        topics: [
          {
            name: "Judicial Independence & Appointment",
            keyCase: "CRA 2005",
            principle: "Independence: security of tenure, guaranteed salaries, immunity from suit, contempt protects. CRA 2005: Supreme Court (replaced Law Lords), Lord Chancellor no longer judge, Judicial Appointments Commission (independent appointment). Judges cannot be MPs.",
            examTip: "Security of tenure: senior judges (Circuit+) removable only by both Houses address to Monarch (never happened). Lower: Lord Chancellor can remove (misconduct). Salaries: charged on Consolidated Fund (not voted annually). Immunity: civil immunity for judicial acts. JAC: independent, merit-based, diversity. Lord Chancellor: no longer head of judiciary (Lord Chief Justice now), removed from judicial role."
          },
          {
            name: "Judicial Roles & Functions",
            keyCase: "Various",
            principle: "Trial: determine facts, apply law, manage trial. Appellate: review lower court decision (law or fact depending on court). Judicial review: supervise public bodies (legality not merits). Statutory interpretation: interpret legislation (apply purposive/literal etc).",
            examTip: "Trial judge: fact-finder (jury does in Crown Court criminal/rare civil), apply law, procedural management, sentencing (criminal). Appellate: error of law (always), error of fact (limited - special reasons), exercise of discretion (interfere if wrong in principle). Judicial review: legality not merits (courts don't substitute decision, only quash if unlawful). Statutory interpretation: use various aids/rules."
          }
        ]
      },
      {
        title: "Legal Profession",
        topics: [
          {
            name: "Solicitors - Role & Regulation",
            keyCase: "Solicitors Regulation Authority",
            principle: "Solicitors: qualified lawyers (SRA regulated). Direct client contact, wide work (transactional, contentious, advisory). Rights of audience: generally magistrates/County/tribunal, Higher Rights (Civil/Criminal) for higher courts after qualification.",
            examTip: "Qualification: degree/GDL + SQE1 + SQE2 + 2 years QWE (Qualifying Work Experience). SRA: regulates solicitors, firms, education. Work: conveyancing, wills/probate, family, company/commercial, civil litigation, criminal defense. Rights of audience: automatic lower courts, Higher Rights additional qualification. Solicitors outnumber barristers (~150k vs ~17k)."
          },
          {
            name: "Barristers - Role & Regulation",
            keyCase: "Bar Standards Board",
            principle: "Barristers: specialist advocates (BSB regulated). Traditionally no direct client access (via solicitor), now direct access possible (public access). Rights of audience: all courts. Chambers (self-employed) or employed. Cab rank rule: must accept if field/available/proper fee.",
            examTip: "Qualification: degree/GDL + Bar course + pupillage (12 months). BSB regulates. Specialize: advocacy, advisory, drafting. Self-employed: member of chambers, instructed by solicitors. Employed: CPS, Government Legal Department, in-house. Public access: direct instruction (not all areas). QCs (now KCs): senior counsel (silk), ~10% of bar. Cab rank: must accept brief if available, offered proper fee, in field, client can pay."
          },
          {
            name: "Other Legal Professionals",
            keyCase: "Various regulators",
            principle: "Legal Executives (CILEx): fee-earners in solicitors' firms, some same rights as solicitors. Licensed Conveyancers: specialist conveyancing. Costs Lawyers: specialist in costs. Notaries: authenticate documents. Paralegals: unregulated support roles.",
            examTip: "CILEx Fellows: rights of audience in some courts, can practice independently as Authorized Persons. Licensed Conveyancers: CLC regulated, conveyancing only (competition to solicitors). Costs Lawyers: costs drafting, assessment. Notaries: Faculty Office regulates, certify documents for use abroad. Paralegals: no regulation, support qualified lawyers, many experienced."
          },
          {
            name: "Legal Aid & Access to Justice",
            keyCase: "LASPO 2012",
            principle: "Legal aid: state funding for legal services. LASPO 2012: severe cuts. Civil: only specific categories (domestic violence, children, homelessness, debt if losing home, mental capacity). Criminal: means and interests tested. Public defender service.",
            examTip: "Civil legal aid: means test (income/capital), merit test, only prescribed categories. Excluded: most PI, family (except DV), housing (unless losing home), employment, immigration (most). Criminal: means test (magistrates = gross income, Crown = disposable income), interests of justice test (5 Widgery factors - lose liberty, livelihood, serious damage, substantial question of law, unable understand). Duty solicitor: free initial advice police station/magistrates. Advice agencies: Law Centres, Citizens Advice (free)."
          }
        ]
      }
    ]
  },
  "Ethics & Professional Conduct": {
    icon: Shield,
    color: "red",
    description: "SRA Principles, Conduct Rules, Conflicts, Confidentiality & Accountability",
    sections: [
      {
        title: "SRA Principles & Standards",
        topics: [
          {
            name: "The Seven Principles",
            keyCase: "SRA Principles 2019",
            principle: "1. Justice & rule of law, 2. Public trust, 3. Independence, 4. Honesty, 5. Integrity, 6. Encourage equality/diversity/inclusion, 7. Best interests of client. Principles override all other requirements. Apply to all individuals/firms.",
            examTip: "Hierarchy when conflict: Principles 1-2 (justice, public trust) trump Principle 7 (client interests). Example: client wants you to mislead court = refuse (Principle 1 overrides 7). All seven apply to all at all times (not just when acting for clients). Serious breaches judged against Principles. Integrity includes proper behavior outside work if affects trust in profession."
          },
          {
            name: "Outcomes-Focused Regulation",
            keyCase: "SRA regulatory approach",
            principle: "Regulation focuses on outcomes (what must be achieved) not prescriptive rules (how). Solicitors must achieve outcomes, use own judgment on how. Indicative behaviors: helpful guidance, not mandatory. Flexible but requires professional judgment.",
            examTip: "Not rule-book approach. Solicitors must: act with integrity, maintain trust, provide competent service, manage firm properly. Indicative behaviors: examples of complying/failing (neither exhaustive nor mandatory). Flexibility = can adapt to different situations but must justify decisions. Professional judgment key. More responsibility on individual solicitors."
          }
        ]
      },
      {
        title: "Client Care & Service",
        topics: [
          {
            name: "Information to Clients",
            keyCase: "SRA Code para 8",
            principle: "Must give clients best information possible about costs (8.7): basis of charges, likely cost, assumptions, any fees payable to solicitor/others. Client care letter at outset. Costs updates as matter progresses. Terms of business. Complaints procedure.",
            examTip: "Transparency requirements: basis (hourly rate, fixed fee, etc), likely total (or range), assumptions (if hours unknown), disbursements. Update if significant change (8.7). Terms: scope of work, who doing work, supervisory arrangements. Complaints: procedure in writing, provided at outset, Legal Ombudsman information (8.3-8.5). Vulnerable clients: consider needs, reasonable adjustments."
          },
          {
            name: "Competence & Service",
            keyCase: "SRA Code para 3.2",
            principle: "Must ensure services provided competently and in timely manner (3.2). Maintain competence (CPD). Proper supervision of staff. Ensure work you undertake within your competence or properly supervised. Delegate appropriately.",
            examTip: "Competence = knowledge, skills, experience appropriate for matter. Must keep up to date (CPD). If lack competence: get supervision, refer to specialist, acquire knowledge/skills. Timely = reasonable time frames, progress matter, respond promptly. Supervision: appropriate to experience of supervised person and nature of work. Cannot delegate reserved legal activities to unqualified unless supervised."
          },
          {
            name: "Undertakings",
            keyCase: "SRA Glossary",
            principle: "Undertaking = statement (written or oral) by you/your firm to someone who reasonably places reliance on it, that you/your firm will do something or cause something to be done. Binding even if inadvertent. Must perform or ensure performed. Breach = professional misconduct.",
            examTip: "Elements: statement, made by you/firm, reasonably relied on, do/cause to be done. Binding even if: not intended, word 'undertaking' not used, given inadvertently. Must be possible to perform. Examples: hold to order of court, discharge mortgage on completion, send documents. Breach serious: can be struck off. If cannot perform: inform immediately, seek release. Standard undertakings: Law Society formulae (exchange of contracts)."
          }
        ]
      },
      {
        title: "Conflicts of Interest",
        topics: [
          {
            name: "Own Interest Conflicts",
            keyCase: "SRA Code para 6.1",
            principle: "Must not act if own interests conflict with client's or significant risk they will (6.1). Very limited exceptions. Examples: financial interest in matter, personal relationship with other side, lending to client, sexual relationship with client.",
            examTip: "Cannot act if YOU have interest conflicting with client. Rare exceptions: (1) client is lending institution and act for lender + borrower (own standard terms), (2) buying from/selling to client (price independently verified, client advised get independent advice). Financial interest: share in company you're advising, property you're acting on. Sexual relationship: prohibited (7.1 Solicitors Code). Lending to client: generally prohibited."
          },
          {
            name: "Client Conflicts",
            keyCase: "SRA Code para 6.2",
            principle: "Cannot act for two+ clients if conflict or significant risk of conflict (6.2). Exceptions: (1) competing for same asset (substantially common interest, separate representation, informed consent), (2) substantially common interest, (3) agreed commercial terms (multiple lenders).",
            examTip: "Two clients with conflicting interests = cannot act for both. Examples: buyer + seller, claimant + defendant, two bidders for same property, company + director in dispute. Exceptions narrow: (1) Competing: both want same thing (acquisition), separately represented, informed consent. (2) Common interest: clear common purpose (joint purchase), no conflict on how achieve, separately represented, consent. (3) Lenders: agreed terms, multiple lenders same transaction, consent. Cannot act: litigation against each other, buyer + seller in same transaction."
          },
          {
            name: "Confidentiality & Conflicts",
            keyCase: "SRA Code para 6.3-6.5",
            principle: "Keep clients' affairs confidential (6.3) except: consent, law requires, prevent death/serious harm. Cannot act if confidential information from former client conflicts with duty to current client (6.5) unless effective safeguards + consent. Information barriers possible if sophisticated clients.",
            examTip: "Confidentiality = fundamental (survives end of retainer, survives death). Exceptions: client consent (but privilege belongs to client, cannot waive without consent), legal obligation (court order, money laundering regulations), prevent death/serious injury. Conflict: if know confidential info about A that would help B or harm A, cannot act for B. Safeguards: information barriers (rare, sophisticated clients only), separate offices, different teams. Usually = decline to act."
          }
        ]
      },
      {
        title: "Advocacy & Court Duties",
        topics: [
          {
            name: "Overriding Duty to Court",
            keyCase: "SRA Code para 2.1-2.7",
            principle: "Duty to court/tribunal overrides duty to client (2.1). Must not mislead/attempt to mislead (2.2). Must comply with court orders/directions (2.3). Must draw relevant legal authorities to court (even if against client) (2.4). Withdraw if client insists misleading court.",
            examTip: "Duty to court paramount. Cannot mislead: false evidence, fail to correct own error, allow client to mislead. Must disclose adverse authorities (case law/statutes against your case) unless other side cites. Cannot draft witness statement you know contains false evidence. Client insists misleading = cease to act (but cannot reveal confidential info when explaining withdrawal). Professional embarrassment basis for withdrawal."
          },
          {
            name: "Witness Evidence & Coaching",
            keyCase: "Professional conduct rules",
            principle: "Cannot coach witnesses (telling what to say). Can take proof of evidence (record what witness says). Can advise on procedure, court room layout, manner of giving evidence. Cannot suggest answers or tell witness what court wants to hear.",
            examTip: "Proof of evidence: ask open questions, record what witness says (their words not yours), read back for accuracy. Proper preparation: explain procedure, oath/affirmation, who's who in court, cross-examination process, speak clearly, ask if don't understand. Improper: 'court will want to hear X', 'you should say Y', rehearsing specific answers, suggesting what would be convincing. If witness changes story: advise cannot call if know false, may need cease to act."
          },
          {
            name: "Wasted Costs Orders",
            keyCase: "SCA 1981 s.51",
            principle: "Court can order legal representative personally pay wasted costs (costs incurred by improper/unreasonable/negligent act/omission). Three-stage test: improper/unreasonable/negligent, caused costs to be wasted, just to make order. Can exceed your own costs.",
            examTip: "Wasted costs = personally liable (not client, not firm insurance in all cases). Examples: failing to advise client properly, pursuing hopeless case, failing to attend, failing to prepare, breach professional duties. Three stages all required: (1) improper = breach duty to court, unreasonable = vexatious/harassment, negligent = fell below standard; (2) causation (but for your act, costs not wasted); (3) just (consider all circumstances). Rare but serious. Warn client in advance if risks."
          }
        ]
      },
      {
        title: "Financial Conduct & Accountability",
        topics: [
          {
            name: "Client Money Rules",
            keyCase: "SRA Accounts Rules 2019",
            principle: "Client money: money held/received for client (or third party). Must hold in separate client account. Cannot mix with office money. Withdraw only for proper purposes (payment on behalf, proper fees, transfer). Reconcile every 5 weeks. Accountant's report annually.",
            examTip: "Client money = belongs to client/third party. Must be separate (not firm's money). Examples: money on account, completion money, damages, stakeholder deposit. Cannot use for office expenses. Interest: if £500+ held 8+ weeks or would earn £20+ = account separately or pay fair sum. Breach = professional misconduct + potentially criminal (theft). Reconciliation: compare ledger to bank statement, investigate discrepancies immediately."
          },
          {
            name: "Reporting Obligations & Whistleblowing",
            keyCase: "SRA Code para 7",
            principle: "Must report serious breaches by others to SRA (7.7). Cooperate with SRA/LO/regulators (7.1). Material breaches in own firm = report to COLP/COFA. COLP/COFA = report material breaches to SRA. Protect whistleblowers.",
            examTip: "Duty to report: serious breach by any solicitor/firm = report to SRA (not minor/trivial). Examples: dishonesty, client money breaches, serious misconduct. Firm's COLP/COFA: responsible for reporting own firm's material breaches to SRA. Material = breach of Principles/requirements, outcome/risk significant. Protection: cannot victimize whistleblower. Public interest disclosure (PIDA 1998) protects employees. Confidentiality not bar to reporting (legal obligation exception)."
          },
          {
            name: "Liability & Insurance",
            keyCase: "SRA Indemnity Insurance Rules",
            principle: "Must have adequate professional indemnity insurance (PII). Minimum terms prescribed by SRA. Covers negligence claims against firm. Cannot exclude liability for death/personal injury negligently caused. Cannot exclude liability for own fraud. Run-off cover when cease practice.",
            examTip: "PII mandatory (Firms Code para 9.1). Minimum cover: £2m (or £3m if high-risk). Must cover: civil liability, partnership/directors/employees, up to 6 years after claim. Excludes: fraud (firm level), deliberate wrongdoing, fines/penalties. Own fraud: cannot exclude personal liability. Individual solicitors: covered by firm's policy. Cease practice: run-off cover required (6 years minimum). Claims: notify insurer promptly, don't admit liability, cooperate with insurers."
          }
        ]
      }
    ]
  }
};

export default function MindMaps() {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [activeTopics, setActiveTopics] = useState({});
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Update activeTopics when selectedSubject changes
  useEffect(() => {
    if (selectedSubject) {
      // Initialize all topics in the selected subject to be closed
      const initialActiveTopics = {};
      MIND_MAP_DATA[selectedSubject].sections.forEach((section, sectionIndex) => {
        section.topics.forEach((topic, topicIndex) => {
          initialActiveTopics[`${selectedSubject}-${sectionIndex}-${topicIndex}`] = false;
        });
      });
      setActiveTopics(initialActiveTopics);
    } else {
      setActiveTopics({});
    }
  }, [selectedSubject]);

  const handleSelectSubject = (subjectName) => {
    setSelectedSubject(subjectName);
    setSearchTerm(''); // Clear search when subject changes
  };

  const handleTopicClick = (key) => {
    setActiveTopics((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getSubjectIcon = (subjectName) => {
    const subject = MIND_MAP_DATA[subjectName];
    if (!subject) return null;
    const IconComponent = subject.icon;
    return <IconComponent size={20} className={`mr-2 ${subject.color === 'white' ? 'text-gray-800' : `text-${subject.color}-500`}`} />;
  };

  const allSubjects = Object.keys(MIND_MAP_DATA);

  // Filter subjects based on selected filter and search term
  const filteredSubjects = allSubjects
    .filter(subjectName => {
      const subject = MIND_MAP_DATA[subjectName];
      const matchFilter = subjectFilter === 'All' || subject.color === subjectFilter;
      const matchSearchTerm = searchTerm === '' ||
                              subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              subject.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              subject.sections.some(section =>
                                section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                section.topics.some(topic =>
                                  topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  topic.keyCase.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  topic.principle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  topic.examTip.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                              );
      return matchFilter && matchSearchTerm;
    })
    .sort((a, b) => a.localeCompare(b)); // Sort alphabetically

  // Extract all unique colors for filter options
  const uniqueColors = [...new Set(allSubjects.map(subject => MIND_MAP_DATA[subject].color))];

  return (
    <div className="container mx-auto p-4 md:p-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 text-center"
      >
        Law Mind Maps
      </motion.h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        <Select onValueChange={handleSelectSubject} value={selectedSubject || ''}>
          <SelectTrigger className="w-full md:w-[280px]">
            <SelectValue placeholder="Select a Law Subject" />
          </SelectTrigger>
          <SelectContent>
            {filteredSubjects.map((subjectName) => (
              <SelectItem key={subjectName} value={subjectName}>
                {getSubjectIcon(subjectName)}
                {subjectName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search subjects or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 w-full md:w-[280px]"
          />

          <Select onValueChange={setSubjectFilter} value={subjectFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Colors</SelectItem>
              {uniqueColors.map(color => (
                <SelectItem key={color} value={color} className="capitalize">
                  <Badge className={`bg-${color}-500 mr-2`}>{color}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedSubject && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-xl"
        >
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold flex items-center">
                {getSubjectIcon(selectedSubject)}
                {selectedSubject}
              </CardTitle>
              <Badge className={`bg-${MIND_MAP_DATA[selectedSubject].color}-500 text-white`}>
                {MIND_MAP_DATA[selectedSubject].color.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 italic">{MIND_MAP_DATA[selectedSubject].description}</p>
            </CardContent>
          </Card>

          <Accordion type="multiple" className="w-full">
            {MIND_MAP_DATA[selectedSubject].sections.map((section, sectionIndex) => (
              <motion.div
                key={sectionIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: sectionIndex * 0.1 }}
                className="mb-4"
              >
                <AccordionItem value={`section-${sectionIndex}`} className="border-b">
                  <AccordionTrigger className="text-lg font-semibold text-gray-800 hover:bg-gray-50 p-2 rounded-md">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent className="pl-4 pt-2">
                    {section.topics.map((topic, topicIndex) => {
                      const topicKey = `${selectedSubject}-${sectionIndex}-${topicIndex}`;
                      return (
                        <motion.div
                          key={topicKey}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: topicIndex * 0.05 }}
                          className="mb-3"
                        >
                          <Card
                            className="p-4 border rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-all duration-200"
                            onClick={() => handleTopicClick(topicKey)}
                          >
                            <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
                              <CardTitle className="text-md font-medium text-gray-700">
                                {topic.name}
                              </CardTitle>
                              <Badge variant="outline" className="text-sm">
                                {topic.keyCase}
                              </Badge>
                            </CardHeader>
                            {activeTopics[topicKey] && (
                              <CardContent className="mt-2 p-0 text-sm text-gray-600">
                                <p className="mb-2">
                                  <strong className="text-gray-800">Principle:</strong> {topic.principle}
                                </p>
                                <p>
                                  <strong className="text-gray-800">Exam Tip:</strong> {topic.examTip}
                                </p>
                              </CardContent>
                            )}
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      )}

      {!selectedSubject && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center text-gray-500 mt-16"
        >
          <p className="text-lg">Please select a law subject from the dropdown above to explore its mind map.</p>
        </motion.div>
      )}
    </div>
  );
}
