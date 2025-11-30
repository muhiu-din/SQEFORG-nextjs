"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Network, Book, Shield, Gavel, Home, Briefcase, LandPlot, Scroll, PiggyBank, Scale, Euro, Building, Users, Handshake, Drama } from 'lucide-react';
import { motion } from 'framer-motion';

const IconWrapper = ({ icon: Icon, color }) => {
    const colorClasses = {
        blue: "bg-blue-100 text-blue-600",
        red: "bg-red-100 text-red-600",
        purple: "bg-purple-100 text-purple-600",
        green: "bg-green-100 text-green-600",
        yellow: "bg-yellow-100 text-yellow-600",
        indigo: "bg-indigo-100 text-indigo-600",
        teal: "bg-teal-100 text-teal-600",
        sky: "bg-sky-100 text-sky-600",
        fuchsia: "bg-fuchsia-100 text-fuchsia-600",
        orange: "bg-orange-100 text-orange-600",
        lime: "bg-lime-100 text-lime-600",
        cyan: "bg-cyan-100 text-cyan-600",
        rose: "bg-rose-100 text-rose-600",
    };
    return (
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
        </div>
    )
};

const BLACK_LETTER_LAW_DATA = {
  "Contract Law": {
    icon: Handshake,
    color: "blue",
    sections: [
      {
        title: "Formation of a Contract",
        points: [
          { title: "Offer", content: "A clear expression of willingness to be bound on specific terms. Distinguish from Invitation to Treat (e.g., goods on a shelf in *Pharmaceutical Society v Boots*; adverts in *Partridge v Crittenden*). A unilateral offer is made to the world and accepted by performance (*Carlill v Carbolic Smoke Ball Co.*)." },
          { title: "Acceptance", content: "Unqualified, 'mirror image' assent to all terms of the offer. A counter-offer destroys the original offer (*Hyde v Wrench*). Acceptance must be communicated to the offeror. The postal rule is an exception: acceptance occurs on posting (*Adams v Lindsell*), but only applies if it's reasonable to use the post and the letter is correctly addressed and stamped." },
          { title: "Consideration", content: "The 'price' of the promise; each party must give something of value. Must be 'sufficient' but need not be 'adequate' (*Chappell & Co v Nestle*). Past consideration is not good consideration (*Re McArdle*). Performance of an existing public duty is not good consideration unless the promisee goes beyond their duty. Performance of an existing contractual duty owed to the same promisor is not good consideration, unless the promisor obtains a 'practical benefit' (*Williams v Roffey Bros*)." },
          { title: "Intention to Create Legal Relations", content: "In commercial agreements, there is a strong presumption that the parties intend to be legally bound (rebuttable, *Edwards v Skyways*). In social/domestic agreements, it is presumed the parties do *not* intend to be legally bound (rebuttable, *Balfour v Balfour* vs *Merritt v Merritt*)." },
           { title: "Certainty & Completeness", content: "An agreement must be certain and complete to be an enforceable contract. If essential terms are missing or vague, the contract may fail for uncertainty (*Scammell v Ouston*)." }
        ]
      },
      {
        title: "Contents of a Contract",
        points: [
          { title: "Terms vs. Representations", content: "Terms are contractual promises; if broken, remedy is for breach. Representations are pre-contractual statements that induce the contract; if false, remedy is for misrepresentation." },
          { title: "Express & Implied Terms", content: "Express terms are explicitly agreed by the parties. Implied terms are not expressly stated but are read into the contract by statute (e.g., *ss.9-14 Consumer Rights Act 2015* for quality/fitness of goods), custom, or the courts (to give 'business efficacy', *The Moorcock*)." },
          { title: "Classification of Terms", content: "Conditions are fundamental terms; breach allows the innocent party to terminate the contract and claim damages (*Poussard v Spiers*). Warranties are minor terms; breach only allows a claim for damages (*Bettini v Gye*). Innominate terms are not classified until the effect of their breach is known; a serious breach allows termination, a minor breach only damages (*Hong Kong Fir Shipping*)." },
          { title: "Exclusion & Limitation Clauses", content: "Clauses that seek to exclude or limit liability for breach. To be effective, the clause must be: 1) Incorporated into the contract (by signature, notice, or course of dealing), 2) Clear and unambiguous in its wording (construed *contra proferentem*), and 3) Comply with statutory rules (*Unfair Contract Terms Act 1977* for B2B contracts; *Consumer Rights Act 2015* for B2C contracts)." }
        ]
      },
      {
        title: "Vitiating Factors",
        points: [
          { title: "Misrepresentation", content: "A false statement of existing fact or law made by one party to another, which induces them to enter the contract. Types: Fraudulent (made knowingly, without belief in its truth), Negligent (made carelessly, breaching a duty of care, per *Misrepresentation Act 1967 s.2(1)*), and Innocent. Remedies include rescission and/or damages." },
          { title: "Economic Duress", content: "Illegitimate economic pressure which vitiates a party's consent. Requires pressure that is: 1) Illegitimate, 2) A significant cause inducing the claimant to enter the contract, and 3) The claimant had no practical alternative. *Atlas Express v Kafco*." },
          { title: "Undue Influence", content: "Equitable doctrine where one party abuses a relationship of trust and confidence to procure a contract. Can be Actual (proved on facts) or Presumed (arising from specific relationships like solicitor-client, or from a relationship of trust and confidence)." },
          { title: "Mistake", content: "A fundamental error that can render a contract void. Common Mistake (both parties make the same mistake, *Couturier v Hastie*), Mutual Mistake (parties at cross-purposes, *Raffles v Wichelhaus*), or Unilateral Mistake (one party is mistaken, the other knows or ought to know, *Hartog v Colin & Shields*)." }
        ]
      },
      {
        title: "Discharge & Remedies",
        points: [
          { title: "Discharge of Contract", content: "A contract can be discharged by: 1) Performance (all obligations performed exactly), 2) Agreement (parties agree to terminate), 3) Breach (a repudiatory breach of a condition or serious breach of an innominate term), or 4) Frustration (a supervening event makes performance impossible, illegal, or radically different, *Davis Contractors v Fareham UDC*). Frustration cannot be self-induced." },
          { title: "Remedies: Damages", content: "Primary remedy for breach. Aims to put the claimant in the position they would have been in had the contract been performed (*Robinson v Harman*). Damages are subject to rules on: Causation (breach must cause the loss), Remoteness (loss must be a foreseeable type, *Hadley v Baxendale*), and Mitigation (claimant must take reasonable steps to reduce their loss)." },
          { title: "Remedies: Equitable", content: "Discretionary remedies granted only when damages are inadequate. Specific Performance (an order to perform the contract) is common for land sales. Injunctions (orders to do or not do something) can be prohibitory or mandatory." }
        ]
      }
    ]
  },
   "Tort Law": {
    icon: Drama,
    color: "red",
    sections: [
       {
        title: "Negligence: The Core Elements",
        points: [
          { title: "Duty of Care", content: "The legal obligation to avoid causing harm. Established by precedent (e.g., doctor-patient) or the three-stage *Caparo v Dickman* test: 1) Was the harm reasonably foreseeable? 2) Is there a relationship of proximity between claimant and defendant? 3) Is it fair, just, and reasonable to impose a duty?" },
          { title: "Breach of Duty", content: "The defendant's conduct fell below the standard of a 'reasonable person' (*Blyth v Birmingham Waterworks*). For professionals, the standard is that of a reasonably competent professional in that field (*Bolam v Friern Hospital*). The court weighs risk factors: likelihood of harm (*Bolton v Stone*), severity of potential harm (*Paris v Stepney BC*), cost of precautions (*Latimer v AEC*), and social utility of the defendant's activity." },
          { title: "Causation: Factual", content: "Did the defendant's breach, as a matter of fact, cause the claimant's loss? The primary test is the 'but for' test: but for the defendant's negligence, would the harm have occurred? (*Barnett v Chelsea & Kensington HMC*). Issues arise with multiple causes." },
          { title: "Causation: Legal (Remoteness)", content: "Determines if the loss is too remote from the breach. The damage must be of a reasonably foreseeable type, even if the exact manner or extent of the harm was not foreseeable (*The Wagon Mound No. 1*). The 'egg-shell skull' rule applies: you take your victim as you find them (*Smith v Leech Brain & Co*)." },
          { title: "Novus Actus Interveniens", content: "A 'new intervening act' that breaks the chain of causation between the defendant's breach and the claimant's loss. It can be an act of a third party, the claimant, or a natural event, but it must be unforeseeable and independent." }
        ]
      },
      {
        title: "Specific Torts & Liability",
        points: [
          { title: "Occupiers' Liability", content: "Duty owed by an occupier for the state of their premises. For visitors, the duty under the *Occupiers' Liability Act 1957* is to take reasonable care to see the visitor will be reasonably safe. For non-visitors/trespassers, the duty under the *Occupiers' Liability Act 1984* is narrower, only covering dangers the occupier is aware of and where they know of the trespasser's presence." },
          { title: "Private Nuisance", content: "An 'unlawful interference with a person's use or enjoyment of land'. It must be an unreasonable interference, considering factors like locality, duration, sensitivity of the claimant, and malice. Only a person with an interest in the land can sue (*Hunter v Canary Wharf*). Remedies include damages and injunctions." },
          { title: "Vicarious Liability", content: "Makes an employer legally responsible for torts committed by an employee if committed 'in the course of employment'. Two key stages: 1) Is the relationship one of employment or 'akin to employment'? 2) Is the tort sufficiently closely connected with the nature of the employment? (*Lister v Hesley Hall*, *Mohamud v Morrisons*)." },
          { title: "Psychiatric Harm ('Nervous Shock')", content: "A claimant can recover for a recognised psychiatric illness caused by negligence. Primary victims are those directly involved and at risk of physical harm. Secondary victims are those who witness the event or its immediate aftermath; they must satisfy the strict *Alcock* control mechanisms (close tie of love and affection, proximity in time and space, perception through own unaided senses)." }
        ]
      },
      {
        title: "Defences & Remedies in Tort",
        points: [
          { title: "Contributory Negligence", content: "A partial defence under the *Law Reform (Contributory Negligence) Act 1945*. If the claimant's own carelessness contributed to their loss, their damages are reduced by a percentage reflecting their share of responsibility." },
          { title: "Volenti Non Fit Injuria (Consent)", content: "A complete defence. The claimant voluntarily, with full knowledge of the nature and extent of the risk, agreed to accept it. It is difficult to establish, especially in employment or rescue situations." },
          { title: "Illegality (Ex Turpi Causa)", content: "A defence that a claimant cannot recover compensation for loss suffered while engaged in illegal activity. The court considers whether allowing the claim would create inconsistency in the law. *Patel v Mirza*." },
          { title: "Remedies in Tort", content: "The primary remedy is compensatory damages, aiming to restore the claimant to their pre-tort position. This can include special damages (quantifiable pre-trial losses) and general damages (non-quantifiable losses like pain and suffering). Injunctions are also a key remedy for ongoing torts like nuisance." }
        ]
      }
    ]
  },
  "Criminal Law": {
    icon: Gavel,
    color: "purple",
    sections: [
      {
        title: "Core Principles",
        points: [
          { title: "Actus Reus (AR)", content: "The 'guilty act.' Can be an act, an omission (if a duty to act exists, e.g., contractual, special relationship), or a state of affairs." },
          { title: "Mens Rea (MR)", content: "The 'guilty mind.' Intention (direct or oblique, *R v Woollin*) or Recklessness (subjective, *R v G* - defendant must foresee the risk)." },
          { title: "Coincidence & Transferred Malice", content: "AR and MR must coincide in time (can be a continuing act, *Fagan v MPC*). Transferred malice allows MR to be transferred from intended victim to actual victim." },
          { title: "Strict Liability", content: "Offences that do not require proof of mens rea for at least one element of the actus reus. Common in regulatory offences (e.g., pollution, food safety)." }
        ]
      },
      {
        title: "Fatal & Non-Fatal Offences",
        points: [
          { title: "Homicide", content: "Murder (unlawful killing with intention to kill or cause GBH) and Manslaughter. Voluntary Manslaughter (partial defences: Loss of Control under *ss.54-55 Coroners and Justice Act 2009*; Diminished Responsibility under *s.2 Homicide Act 1957*). Involuntary Manslaughter (unlawful act or gross negligence)." },
          { title: "Non-Fatal Offences Against the Person (*OAPA 1861*)", content: "Assault (causing apprehension of immediate unlawful force), Battery (application of unlawful force), Assault Occasioning Actual Bodily Harm (*s.47*), Maliciously Wounding or Inflicting Grievous Bodily Harm (*s.20*), Wounding or Causing GBH with Intent (*s.18*)." }
        ]
      },
      {
        title: "Property Offences",
        points: [
          { title: "Theft (*s.1 Theft Act 1968*)", content: "Dishonest appropriation of property belonging to another with intention to permanently deprive. Key elements defined in *ss.2-6*." },
          { title: "Robbery (*s.8 Theft Act 1968*)", content: "Theft accompanied by force or threat of force immediately before or at the time of the theft." },
          { title: "Burglary (*s.9 Theft Act 1968*)", content: "*s.9(1)(a)*: Entering a building as a trespasser with intent to steal, inflict GBH, or do unlawful damage. *s.9(1)(b)*: Having entered as a trespasser, steals or attempts to steal, or inflicts or attempts to inflict GBH." },
          { title: "Fraud (*Fraud Act 2006*)", content: "Main offences: Fraud by false representation (*s.2*), by failing to disclose information (*s.3*), and by abuse of position (*s.4*)." }
        ]
      },
       {
        title: "Defences",
        points: [
          { title: "General Defences", content: "Insanity, automatism, intoxication (specific vs. basic intent), self-defence." },
          { title: "Partial Defences to Murder", content: "Loss of control and diminished responsibility (reduces murder to voluntary manslaughter)." }
        ]
      }
    ]
  },
   "Business Law & Practice": {
    icon: Briefcase,
    color: "indigo",
    sections: [
      {
        title: "Business Structures & Formation",
        points: [
            { title: "Sole Trader", content: "An individual running a business. No legal distinction between the owner and the business. **Liability:** Unlimited personal liability for all business debts. **Setup:** Simple, no registration required other than with HMRC for tax." },
            { title: "Partnership (*Partnership Act 1890*)", content: "Two or more persons carrying on a business in common with a view to profit. **Liability:** Partners have unlimited, joint liability for firm debts. **Relations:** Governed by the Act unless a Partnership Agreement specifies otherwise. Key default provisions include equal sharing of profits/losses and no new partner without unanimous consent." },
            { title: "Limited Liability Partnership (LLP) (*LLP Act 2000*)", content: "A hybrid structure with the flexibility of a partnership but with the benefit of limited liability. It's a separate legal entity. **Liability:** Members' liability is limited to their capital contribution. **Formalities:** Must be registered at Companies House and have a members' agreement." },
            { title: "Private Limited Company (Ltd)", content: "A separate legal entity from its owners (shareholders) (*Salomon v Salomon*). **Liability:** Shareholders' liability is limited to any amount unpaid on their shares. **Formation:** Requires registration with Companies House, submitting Form IN01, Memorandum & Articles of Association." }
        ]
      },
       {
        title: "Company Constitution & Decision-Making",
        points: [
            { title: "Articles of Association", content: "The company's internal rulebook. Governs the relationship between shareholders and directors. Companies can adopt the standard 'Model Articles' or create bespoke ones. Can only be amended by a special resolution of the shareholders (75% majority)." },
            { title: "Directors' Decisions", content: "Directors manage the company day-to-day. Decisions are made at Board Meetings (BM). **Quorum:** Minimum number of directors required to be present for the meeting to be valid (set by Articles, default is 2 for Model Articles). **Voting:** Decisions pass by a simple majority vote. The chairman may have a casting vote. **Minutes:** Must be kept for 10 years (*s.248 CA 2006*)." },
            { title: "Shareholders' Decisions", content: "Made either at a General Meeting (GM) or by a Written Resolution (for private companies only, *s.288 CA 2006*). **Ordinary Resolution:** Passed by a simple majority (>50%) of votes cast. Used for routine matters like appointing a director. **Special Resolution:** Passed by a majority of not less than 75% of votes cast. Required for major decisions like changing the company name or amending the Articles (*s.283 CA 2006*)." }
        ]
      },
      {
        title: "Directors & Their Duties (*ss.171-177 CA 2006*)",
        points: [
          { title: "s.171: Duty to Act Within Powers", content: "Directors must act in accordance with the company's constitution and only exercise powers for the purposes for which they are conferred." },
          { title: "s.172: Duty to Promote the Success of the Company", content: "A director must act in the way they consider, in good faith, would be most likely to promote the success of the company for the benefit of its members as a whole. They must have regard to a non-exhaustive list of factors including long-term consequences, employee interests, business relationships, and community/environmental impact." },
          { title: "s.174: Duty to Exercise Reasonable Care, Skill & Diligence", content: "This is a dual objective/subjective test. A director must have the general knowledge, skill, and experience that may reasonably be expected of a person carrying out their functions (objective part), and the actual knowledge, skill, and experience which they possess (subjective part)." },
          { title: "s.175/177: Duties Regarding Conflicts of Interest", content: "*s.175* is the duty to avoid conflicts of interest. *s.177* requires a director to declare the nature and extent of any interest in a *proposed* transaction or arrangement with the company. *s.182* applies to interests in *existing* transactions." }
        ]
      },
       {
        title: "Company Finance",
        points: [
          { title: "Share Capital", content: "Equity finance raised by issuing shares to shareholders. Shares can be ordinary, preference, etc. Governed by rules in the Companies Act 2006." },
          { title: "Debt Finance", content: "Money borrowed by the company, e.g., bank loans or issuing debentures. A debenture is an instrument acknowledging a debt. It is often secured by a charge over the company's assets." },
          { title: "Types of Charge", content: "**Fixed Charge:** Attaches to a specific, identifiable asset (e.g., a building). The company cannot deal with the asset without the lender's consent. **Floating Charge:** 'Floats' over a class of circulating assets (e.g., stock). The company can deal with these assets in the ordinary course of business until 'crystallisation' (e.g., on insolvency), at which point it fixes to the specific assets in that class." }
        ]
      }
    ]
  },
  "Property Practice": {
    icon: Home,
    color: "green",
    sections: [
      {
        title: "The Conveyancing Process: An Overview",
        points: [
            { title: "1. Pre-Contract Stage", content: "The bulk of the solicitor's work. Involves taking instructions, preparing pre-contract package (seller), investigating title and conducting searches (buyer). The parties are not legally bound and can walk away." },
            { title: "2. Exchange of Contracts", content: "The point at which the transaction becomes legally binding. A completion date is fixed. The buyer typically pays a 10% deposit." },
            { title: "3. Pre-Completion Stage", content: "Buyer's solicitor drafts the Transfer Deed (TR1), raises requisitions on title, and performs pre-completion searches (e.g., OS1 search to freeze the register)." },
            { title: "4. Completion", content: "The day the balance of the purchase price is paid, the transfer is dated, and keys are released. The legal ownership is transferred." },
            { title: "5. Post-Completion", content: "Buyer's solicitor deals with Stamp Duty Land Tax (SDLT) payment and registration of the transfer at HM Land Registry." }
        ]
      },
      {
        title: "Key Pre-Contract Steps (Buyer's Solicitor)",
        points: [
            { title: "Investigating Title (Registered Land)", content: "Reviewing the Official Copies of the register obtained from HMLR. **Property Register:** Describes the property and benefits attached to it (e.g., easements). **Proprietorship Register:** States the class of title, identifies the owner (registered proprietor), and reveals any restrictions on their power to sell. **Charges Register:** Lists third-party rights that burden the property (e.g., mortgages, restrictive covenants, easements)." },
            { title: "Standard Searches & Enquiries", content: "**Local Land Charges Search (LLC1):** Reveals matters like planning permissions and financial charges. **Enquiries of the Local Authority (CON29):** Raises questions about matters such as nearby road schemes and planning enforcement notices. **Drainage and Water Enquiries (CON29DW):** Checks for connections to public sewers and mains water. **Environmental Search:** Assesses risk of contaminated land liability." },
            { title: "Pre-Contract Enquiries of the Seller", content: "Raising questions with the seller's solicitor based on the title investigation and search results. Usually done using standard forms like the Law Society's TA6 (Property Information Form) and TA10 (Fittings and Contents Form)." }
        ]
      },
      {
        title: "Exchange, Completion & Registration",
        points: [
            { title: "Exchange of Contracts", content: "Must comply with *s.2 Law of Property (Miscellaneous Provisions) Act 1989*: contract must be in writing, signed by both parties, and contain all agreed terms. Usually effected by telephone using one of the Law Society's formulae." },
            { title: "The Transfer Deed", content: "The document that legally transfers ownership. For registered land, this is usually Form TR1. It must be executed as a deed (*s.52 LPA 1925*)." },
            { title: "Pre-Completion Searches", content: "**OS1 Search (for whole property):** An official search at HMLR that gives the buyer a priority period (usually 30 working days). During this period, no other entry can be registered against the title. It also checks for any new entries since the initial title investigation." },
            { title: "Post-Completion Registration", content: "After completion, the buyer's solicitor must pay any SDLT due (within 14 days) and then apply to HMLR to register the transfer (Form AP1) before the OS1 priority period expires. Failure to register means the buyer does not acquire legal title." }
        ]
      }
    ]
  },
  "Dispute Resolution": {
    icon: Shield,
    color: "yellow",
    sections: [
        {
            title: "Pre-Action Conduct & ADR",
            points: [
                { title: "The Overriding Objective (*CPR 1.1*)", content: "The court's primary duty is to deal with cases justly and at proportionate cost. This includes ensuring parties are on an equal footing, saving expense, and allotting an appropriate share of court resources. Parties have a duty to help the court further this objective." },
                { title: "Pre-Action Protocols", content: "Detailed, step-by-step codes of conduct that parties are expected to follow before commencing proceedings. Aims to encourage early information exchange and settlement. Failure to comply can lead to costs sanctions (*CPR 44*), even for the winning party." },
                { title: "Alternative Dispute Resolution (ADR)", content: "Includes mediation, arbitration, and early neutral evaluation. The court expects parties to consider ADR. An unreasonable refusal to engage in ADR is a key factor the court will consider when making a costs order (*Halsey v Milton Keynes NHS Trust*)." }
            ]
        },
        {
            title: "Commencing & Responding to Proceedings",
            points: [
                { title: "Issuing & Serving a Claim", content: "A claim is 'commenced' when the court issues a Claim Form (Part 7) at the claimant's request. The claimant must then 'serve' the Claim Form and Particulars of Claim on the defendant. For service within the UK, this must be done within 4 months of the issue date." },
                { title: "Responding to a Claim", content: "After service of the Particulars of Claim, the defendant has 14 days to respond by filing: 1) An Admission; 2) A Defence; or 3) An Acknowledgment of Service (*CPR Part 10*). Filing an AoS extends the time to file a Defence to 28 days from the date of service of the PoC. Failure to respond can lead to the claimant applying for a judgment in default (*CPR Part 12*)." }
            ]
        },
        {
            title: "Case Management & Interim Applications",
            points: [
              { title: "Track Allocation", content: "Once a defence is filed, the court allocates the case to a 'track' based on its value and complexity. **Small Claims Track:** <£10,000. **Fast Track:** £10,000-£25,000, straightforward cases, trial < 1 day. **Multi-Track:** >£25,000 or complex cases." },
              { title: "Costs Management (Multi-Track)", content: "Parties must file and exchange detailed costs budgets using *Precedent H*. The court will then make a Costs Management Order (CMO) approving the budgets. A party's recoverable costs are generally limited to the amount in their approved budget." },
              { title: "Summary Judgment (*CPR Part 24*)", content: "An application for an early judgment without a full trial. The applicant must show that the respondent has 'no real prospect of succeeding' on the claim/defence and there is 'no other compelling reason' for a trial." },
              { title: "Interim Injunctions", content: "A court order to stop a party doing something (prohibitory) or force them to do something (mandatory). The court applies the *American Cyanamid* guidelines: 1) Is there a serious question to be tried? 2) Would damages be an adequate remedy? 3) Where does the 'balance of convenience' lie?" }
            ]
        },
        {
            title: "Evidence, Costs & Settlement",
            points: [
              { title: "Disclosure (*CPR Part 31*)", content: "The process where parties disclose documents to each other. 'Standard disclosure' requires a party to disclose: 1) documents on which they rely; 2) documents which adversely affect their own or another party's case; and 3) documents which support another party's case." },
              { title: "Witness Statements & Expert Evidence", content: "Evidence of fact is given via signed witness statements, which stand as the witness's 'evidence-in-chief' at trial. Expert evidence (*CPR Part 35*) provides opinion on a technical matter. The expert's primary duty is to the court, not the instructing party." },
              { title: "Part 36 Offers", content: "A formal settlement offer made under Civil Procedure Rule 36. It has powerful costs consequences designed to pressure parties into settling. If a claimant makes a Part 36 offer, the defendant fails to accept it, and the claimant then goes on to win at trial and obtains a judgment at least as advantageous as their offer, the defendant will face enhanced penalties on costs and interest." }
            ]
        }
    ]
  },
  "Land Law": {
    icon: LandPlot,
    color: "teal",
    sections: [
      {
        title: "Core Concepts",
        points: [
          { title: "Land Definition (*s.205(1)(ix) LPA 1925*)", content: "Includes the surface, buildings, and intangible rights (hereditaments). 'Cuius est solum, eius est usque ad coelum et ad inferos' - owner of the soil owns everything up to the heavens and down to the depths of the earth (with modern limitations)." },
          { title: "Estates in Land (*s.1 LPA 1925*)", content: "Only two legal estates can exist: Freehold (Fee simple absolute in possession) and Leasehold (Term of years absolute)." },
          { title: "Interests in Land (*s.1 LPA 1925*)", content: "Legal interests (e.g., legal mortgage, legal easement) are limited and must be created by deed (*s.52 LPA 1925*). All other interests are equitable (e.g., restrictive covenant, trust interest, estate contract)." },
          { title: "Registered vs Unregistered Land", content: "Registered land title is guaranteed by the state and recorded at HM Land Registry (*LRA 2002*). Unregistered land relies on proving a chain of title deeds back to a 'good root of title'." }
        ]
      },
      {
        title: "Co-Ownership",
        points: [
          { title: "Joint Tenancy (JT)", content: "Owners are one single entity. Right of survivorship applies. Requires the four unities (possession, interest, title, time). The legal estate MUST be held as a JT." },
          { title: "Tenancy in Common (TIC)", content: "Owners hold distinct 'undivided shares'. No right of survivorship; share can be passed by will. Only possible in equity." },
          { title: "Severance", content: "The process of converting an equitable JT into a TIC. Can be done by written notice (*s.36(2) LPA 1925*) or by acts of severance at common law (*Williams v Hensman*)." }
        ]
      },
      {
        title: "Third Party Rights (Incumbrances)",
        points: [
          { title: "Easements", content: "A right over another's land (e.g., right of way). Must meet the *Re Ellenborough Park* criteria. Can be created expressly, impliedly, or by prescription. Must be registered to be a legal easement over registered land." },
          { title: "Freehold Covenants", content: "A promise made in a deed. The burden of positive covenants does not run with the land. The burden of restrictive covenants can 'run with the land' in equity if the *Tulk v Moxhay* conditions are met." },
          { title: "Mortgages", content: "A charge over land to secure a debt. Gives the lender (mortgagee) rights, including the power of sale if the borrower defaults. A mortgage over registered land must be registered to be a legal mortgage." },
          { title: "Overriding Interests", content: "Unregistered interests that override registered dispositions (*Schedule 3, LRA 2002*), e.g., short leases, interests of persons in actual occupation." }
        ]
      }
    ]
  },
  "Wills & Administration of Estates": {
    icon: Scroll,
    color: "sky",
    sections: [
      {
        title: "Validity of a Will",
        points: [
          { title: "Capacity", content: "Testator must be 18+ and have testamentary capacity (sound mind, memory, and understanding) per the test in *Banks v Goodfellow*." },
          { title: "Intention", content: "Testator must have a general intention to make a will and specific intention to make the particular will. They must know and approve of its contents, free from undue influence or fraud." },
          { title: "Formalities (*s.9 Wills Act 1837*)", content: "For a will to be valid it must be: 1) in writing, 2) signed by the testator (or by someone in their presence and by their direction), 3) it appears the testator intended by their signature to give effect to the will, and 4) the signature is made or acknowledged in the presence of two or more witnesses present at the same time, who then also sign." }
        ]
      },
      {
        title: "Revocation and Alteration",
        points: [
          { title: "Revocation", content: "By a later valid will or codicil, by a declaration of intent to revoke executed like a will, or by destruction with intention to revoke. Marriage or civil partnership automatically revokes a prior will unless made in expectation of it." },
          { title: "Alterations", content: "Alterations made after execution are invalid unless the alteration itself is executed like a will (i.e., signed and witnessed)." }
        ]
      },
      {
        title: "Intestacy Rules",
        points: [
          { title: "No Valid Will", content: "Where a person dies without a valid will (or the will fails to dispose of all assets), their estate is distributed according to statutory intestacy rules under the *Administration of Estates Act 1925*." },
          { title: "Distribution Hierarchy", content: "The rules prioritise a surviving spouse/civil partner, then issue (children/grandchildren), then other relatives in a set order (parents, siblings, etc.). Spouse's entitlement depends on whether the deceased left issue." }
        ]
      },
      {
        title: "Administration of the Estate",
        points: [
          { title: "Personal Representatives (PRs)", content: "Executors (appointed by will) or Administrators (appointed under statute where there's no will or no willing executor) who manage the estate." },
          { title: "Grant of Representation", content: "PRs must obtain a Grant of Probate (for executors) or Grant of Letters of Administration from the court to have legal authority to deal with assets." },
          { title: "Inheritance Tax (IHT)", content: "PRs are responsible for paying any IHT due. This is a tax on the value of the estate, subject to exemptions (e.g., spouse exemption) and the Nil-Rate Band)." },
          { title: "Duties of PRs", content: "To collect in all assets of the deceased, pay all debts and liabilities (including tax), and distribute the net estate to the beneficiaries entitled under the will or intestacy rules." }
        ]
      }
    ]
  },
  "Trusts": {
    icon: PiggyBank,
    color: "fuchsia",
    sections: [
      {
        title: "Creation of Express Trusts",
        points: [
          { title: "The Three Certainties (*Knight v Knight*)", content: "1) Certainty of Intention (to create a trust, not a gift), 2) Certainty of Subject Matter (the trust property must be clearly identifiable), and 3) Certainty of Objects (the beneficiaries must be ascertainable)." },
          { title: "Formalities", content: "Trusts of personality can be created orally. Trusts of land must be evidenced in writing signed by the settlor (*s.53(1)(b) Law of Property Act 1925*). Dispositions of an existing equitable interest must be in writing (*s.53(1)(c) LPA 1925*)." },
          { title: "Constitution", content: "The trust property must be properly transferred to the trustees. 'Equity will not perfect an imperfect gift' and 'equity will not assist a volunteer'." }
        ]
      },
      {
        title: "Trustees' Duties and Powers",
        points: [
          { title: "Fiduciary Duties", content: "A duty of loyalty. Must avoid conflicts of interest, must not make an unauthorized profit from their role (the 'no-profit' rule), and must act gratuitously unless authorized to charge." },
          { title: "Duty of Care", content: "Trustees owe a duty to exercise reasonable care and skill. The standard is set out in *s.1 Trustee Act 2000*." },
          { title: "Investment Duties", content: "Duty to invest the trust fund. Must have regard to the standard investment criteria (suitability and diversification) and seek advice where appropriate (*ss.4-5 Trustee Act 2000*)." },
          { title: "Powers", content: "Powers to maintain beneficiaries, advance capital, delegate, etc., are derived from the trust instrument and statute (e.g., *Trustee Act 1925* and *Trustee Act 2000*)." }
        ]
      },
      {
        title: "Beneficiaries & Breach of Trust",
        points: [
          { title: "Beneficiary Rights", content: "Right to information, right to compel performance of the trust, and the rule in *Saunders v Vautier* (if all beneficiaries are adult, of sound mind and in agreement, they can end the trust and demand the trust property)." },
          { title: "Breach of Trust", content: "Occurs when a trustee acts outside their powers (ultra vires) or fails in their duties. Liability is strict for misapplication of funds, and fault-based for breach of care." },
          { title: "Remedies for Breach", content: "Personal remedy (suing the trustee for compensation for the loss) and Proprietary remedy (tracing the trust property into new forms or into the hands of third parties)." }
        ]
      }
    ]
  },
  "Solicitors Accounts": {
    icon: Scale,
    color: "orange",
    sections: [
        {
            title: "Core Principles & Rules",
            points: [
                { title: "Purpose of SRA Accounts Rules", content: "To ensure client money is kept safe. These rules are a core part of the SRA Standards and Regulations and are strictly enforced. A breach can lead to disciplinary action." },
                { title: "Client Money Definition (Rule 2.1)", content: "Money held or received by a firm relating to regulated services delivered to a client. This includes money held as trustee, as agent, or for payment of unpaid disbursements or costs. It must be kept entirely separate from the firm's own business money." },
                { title: "Prompt Payment into Client Account (Rule 2.3)", content: "All client money must be paid 'promptly' into a client bank account. 'Promptly' is interpreted by the SRA as the same day or the next working day." },
                { title: "Client Account Requirements (Rule 3)", content: "Must be a bank or building society account in England and Wales. The name of the account must include the word 'client' to distinguish it from any business account and to put the bank on notice." },
                { title: "Breaches (Rule 6)", content: "Any breach of the rules must be corrected promptly upon discovery. If a payment from the client account creates a shortage (a 'shortfall'), the firm must immediately replace the missing amount from its own business funds. Material breaches must be reported to the SRA 'promptly'." }
            ]
        },
        {
            title: "Record Keeping & Reconciliations",
            points: [
                { title: "Double-Entry Bookkeeping", content: "Every transaction is recorded twice to ensure the accounts balance. A debit (Dr) entry in one account corresponds to a credit (Cr) entry in another. **Example: Receiving £100 from a client:** Dr Client Cash Account (shows cash has come into the firm's client account); Cr Client's Ledger (shows the firm is holding £100 *for* that client)." },
                { title: "Client Ledger Accounts (Rule 8.1)", content: "A separate ledger must be maintained for each client and for each matter. It must show all transactions related to that specific matter and maintain a running balance." },
                { title: "Bank Reconciliations (Rule 8.3)", content: "A firm must perform a client account reconciliation at least every 5 weeks. This is a three-way reconciliation: **1. Compare** the Client Cash Account balance **with** the Bank Statement balance. **2. Compare** the Client Cash Account balance **with** the total of all the client ledger balances. The three figures should match." }
            ]
        },
        {
            title: "Handling Client Money: Key Transactions",
            points: [
                { title: "Withdrawals from Client Account (Rule 5)", content: "Money can only be withdrawn from the client account for the specific purpose for which it is being held, or following client instructions. You cannot use money held for Client A to pay a liability for Client B." },
                { title: "Payment of Costs (Rule 4.3)", content: "To transfer money from the client account to the business account to pay your firm's costs, you must first send a bill of costs or other written notification of the costs incurred to the client. This is a critical rule." },
                { title: "Interest (Rule 7)", content: "Firms must account to clients for a fair sum of interest on money held for them. The firm must have a written policy on the payment of interest, which must be fair and transparent." },
                { title: "Mixed Receipts", content: "If a single payment is received containing both client money and business money (e.g., payment for damages and costs), the entire sum must be paid into the client account first. The business money portion must then be transferred out to the business account 'promptly'." }
            ]
        }
    ]
  },
  "Constitutional & Administrative Law": {
      icon: Building,
      color: "lime",
      sections: [
          {
              title: "Core UK Constitutional Principles",
              points: [
                  { title: "Parliamentary Sovereignty", content: "The doctrine that Parliament is the supreme law-making body. An Act of Parliament cannot be challenged or invalidated by the courts (*Pickin v British Railways Board*). This has been practically limited by the Human Rights Act 1998 and historical EU membership (*Factortame*)." },
                  { title: "The Rule of Law", content: "A concept with three main elements (as defined by A.V. Dicey): 1) No one can be punished without a clear breach of law established in an ordinary court, 2) Everyone, including government officials, is equal before the law, 3) Constitutional rights are protected by the ordinary law of the land, not a special constitutional code." },
                  { title: "Separation of Powers", content: "The division of state power into three branches to avoid concentration of power: the Legislature (Parliament, which makes law), the Executive (Government, which implements law), and the Judiciary (Courts, which interpret law). In the UK, there is a significant overlap, particularly between the Executive and Legislature." }
              ]
          },
          {
              title: "Sources & Institutions of the Constitution",
              points: [
                  { title: "Uncodified Nature", content: "The UK constitution is not written down in a single, authoritative document. It is drawn from various sources." },
                  { title: "Key Sources", content: "Includes Acts of Parliament (e.g., Magna Carta 1215, Bill of Rights 1689, Human Rights Act 1998), Common Law (case law, e.g., *Entick v Carrington*), Royal Prerogative (powers of the Crown, now exercised by ministers), and Constitutional Conventions (non-legal but politically binding rules)." },
                  { title: "The Executive", content: "Comprises the Government of the day, led by the Prime Minister. Responsible for policy and public administration. Ministers are accountable to Parliament." }
              ]
          },
          {
              title: "Judicial Review",
              points: [
                  { title: "Purpose & Procedure", content: "A mechanism for holding the executive to account by challenging the lawfulness of their decisions, actions, or omissions in court. Permission from the court is required to bring a claim." },
                  { title: "Grounds for Review (The *GCHQ* case)", content: "1) Illegality (acting beyond legal powers, *ultra vires*), 2) Irrationality (a decision so unreasonable no reasonable authority could have made it - known as *Wednesbury* unreasonableness), and 3) Procedural Impropriety (breach of natural justice - the rule against bias and the right to a fair hearing)." },
                  { title: "Human Rights Act 1998 (HRA)", content: "*s.3 HRA* requires courts to interpret legislation compatibly with European Convention on Human Rights (ECHR) rights 'so far as it is possible to do so'. *s.6 HRA* makes it unlawful for a public authority to act in a way which is incompatible with a Convention right, creating a distinct ground for judicial review." },
                  { title: "Remedies", content: "Discretionary remedies include: a quashing order (voids the decision), a prohibiting order (prevents a decision), a mandatory order (compels an action), a declaration, and damages." }
              ]
          }
      ]
  },
  "The Legal System of England & Wales": {
      icon: Gavel,
      color: "cyan",
      sections: [
          {
              title: "The Court System & Judiciary",
              points: [
                  { title: "Civil Courts Hierarchy", content: "Supreme Court (final appeal), Court of Appeal (Civil Division), High Court (with 3 divisions: King's Bench, Chancery, Family), County Court (vast majority of claims), and Magistrates' Court (limited civil jurisdiction)." },
                  { title: "Criminal Courts Hierarchy", content: "Supreme Court, Court of Appeal (Criminal Division), Crown Court (for serious 'indictable' offences and appeals from Magistrates'), and Magistrates' Court (for less serious 'summary' offences)." },
                  { title: "Tribunals", content: "A separate system for resolving specific disputes, such as employment, immigration, and tax. Organized into a First-tier Tribunal and an Upper Tribunal." },
                  { title: "The Judiciary", content: "The roles range from Justices of the Supreme Court to District Judges and lay Magistrates. Judicial independence is a cornerstone of the constitution, protected by security of tenure." }
              ]
          },
          {
              title: "Sources of Law & Legal Method",
              points: [
                  { title: "Legislation (Statute Law)", content: "Primary legislation (Acts of Parliament) is the highest form of law. Secondary (or Delegated) legislation (e.g., Statutory Instruments) is made by bodies to whom Parliament has delegated power." },
                  { title: "Common Law (Case Law)", content: "Law developed by judges through court decisions. It operates through the doctrine of judicial precedent (*stare decisis*), where decisions of higher courts are binding on lower courts." },
                  { title: "Statutory Interpretation", content: "The rules judges use to interpret Acts of Parliament: The Literal Rule, The Golden Rule, The Mischief Rule, and the Purposive Approach. The Human Rights Act 1998 also requires interpretation compatible with ECHR rights." },
                  { title: "EU Law (Retained)", content: "Following Brexit, the *EU (Withdrawal) Act 2018* created 'retained EU law', a category of domestic law based on the EU law that applied on exit day. This body of law continues to be relevant until amended or repealed by the UK Parliament." }
              ]
          }
      ]
  },
  "EU Law": {
      icon: Euro,
      color: "rose",
      sections: [
          {
              title: "Sources & Supremacy (Pre-Brexit Context)",
              points: [
                  { title: "Primary Sources", content: "The Treaties establishing the EU, such as the Treaty on European Union (TEU) and the Treaty on the Functioning of the European Union (TFEU)." },
                  { title: "Secondary Sources", content: "1) Regulations (directly applicable in all member states, no need for national implementation), 2) Directives (binding as to the result to be achieved, but leave the choice of form and methods to member states), and 3) Decisions (binding in their entirety on those to whom they are addressed)." },
                  { title: "Supremacy of EU Law", content: "The foundational principle that where there is a conflict between national law and EU law, EU law prevails. Established in *Costa v ENEL*. Affirmed in the UK context in the *Factortame* litigation." }
              ]
          },
          {
              title: "Key Principles & Single Market Freedoms",
              points: [
                  { title: "Direct Effect", content: "The principle that allows individuals to rely on EU law in their national courts. Vertical direct effect is against the state or an 'emanation of the state'. Horizontal direct effect is against another individual. Regulations have horizontal direct effect; Directives typically only have vertical direct effect." },
                  { title: "The Four Freedoms", content: "The core of the single market: Free movement of Goods (prohibiting customs duties and quantitative restrictions), Free movement of Persons (including workers and their families), Freedom to provide Services, and Free movement of Capital." }
              ]
          },
          {
              title: "Post-Brexit: Retained EU Law",
              points: [
                  { title: "The EU (Withdrawal) Act 2018", content: "This key piece of Brexit legislation created a new category of domestic law called 'retained EU law'. It is a snapshot of the EU law that was in effect in the UK just before exit day." },
                  { title: "Status of Retained EU Law", content: "The principle of supremacy of EU law is maintained in a modified form for pre-exit domestic law. However, new Acts of the UK Parliament can expressly modify or repeal any part of retained EU law. UK courts are no longer bound by post-Brexit CJEU decisions." }
              ]
          }
      ]
  },
    "Legal Services": {
      icon: Users,
      color: "indigo",
      sections: [
          {
              title: "Regulation of Legal Services",
              points: [
                  { title: "Legal Services Act 2007", content: "The primary legislation governing the regulation of legal services in England and Wales. It established the Legal Services Board (LSB) as the independent overarching regulator and set out the regulatory objectives." },
                  { title: "Frontline Regulators", content: "Includes the Solicitors Regulation Authority (SRA) for solicitors and the Bar Standards Board (BSB) for barristers. These bodies are responsible for setting standards, handling entry qualifications, and managing disciplinary matters for their respective professions." },
                  { title: "Reserved Legal Activities", content: "The LSA 2007 defines six activities that can only be carried on by authorised persons: exercise of a right of audience, conduct of litigation, reserved instrument activities (certain conveyancing and probate work), probate activities, notarial activities, and administration of oaths." },
                  { title: "The Legal Ombudsman", content: "An independent body that handles complaints from consumers about the service they have received from their legal service provider. It is a key part of the consumer protection framework." }
              ]
          },
          {
              title: "Funding Legal Services & Costs",
              points: [
                  { title: "Private Funding", content: "The most common method where a client pays the solicitor's fees directly from their own resources." },
                  { title: "Conditional Fee Agreements (CFAs)", content: "A 'no win, no fee' agreement. If the case is won, the solicitor can charge their base costs plus a 'success fee' (capped at 100% of base costs). If lost, the client pays no fees. Commonly used in personal injury and dispute resolution." },
                  { title: "Damages-Based Agreements (DBAs)", content: "A 'no win, no share of the damages' agreement. The solicitor receives an agreed percentage of the damages recovered if the case is won (capped at 25% for personal injury, 50% for most other claims). If lost, the client pays nothing." },
                  { title: "Legal Aid", content: "Public funding for legal services, severely restricted by the *Legal Aid, Sentencing and Punishment of Offenders Act 2012 (LASPO)*. It is available only for specific types of cases (e.g., criminal defence, asylum, housing repossession) and is subject to strict means and merits tests." }
              ]
          }
      ]
  },
  "Ethics & Professional Conduct": {
      icon: Shield,
      color: "teal",
      sections: [
          {
              title: "The SRA Regulatory Framework",
              points: [
                  { title: "The 7 SRA Principles", content: "The mandatory, fundamental tenets of ethical behaviour that underpin all professional conduct. They are: 1. Uphold the rule of law and administration of justice. 2. Act with integrity. 3. Act with independence. 4. Act with honesty. 5. Act in the best interests of each client. 6. Behave in a way that maintains public trust. 7. Uphold proper governance and risk management." },
                  { title: "SRA Codes of Conduct", content: "Separate codes exist for individuals (Code of Conduct for Solicitors, RELs and RFLs) and for firms (Code of Conduct for Firms). They set out the standards and outcomes expected. The focus is on principles rather than prescriptive rules, requiring solicitors to use their professional judgment." }
              ]
          },
          {
              title: "Client Care & Service",
              points: [
                  { title: "Client Information & Costs", content: "You must give clients the best possible information about how their matter will be priced and the likely overall cost, both at engagement and as the matter progresses. This is a key part of the SRA Transparency Rules, which also mandate publishing price information for certain services." },
                  { title: "Service & Competence", content: "You must provide a competent service to your clients and maintain your competence. You must consider a client's attributes, needs and circumstances, and treat them fairly without discrimination." },
                  { title: "Complaints Handling", content: "Firms must have an effective written complaints procedure which is transparent and easy to use. At the end of the firm's procedure, clients must be informed of their right to complain to the Legal Ombudsman and the relevant time limits." }
              ]
          },
          {
              title: "Conflicts of Interest & Confidentiality",
              points: [
                  { title: "Conflicts of Interest", content: "You cannot act if there is an 'own interest conflict' or a 'client conflict' (*para 6.1 and 6.2 of the Codes*). A client conflict exists where you owe separate duties to act in the best interests of two or more clients in relation to the same or related matters, and those duties conflict. Client conflicts have very narrow exceptions." },
                  { title: "Confidentiality & Disclosure", content: "You have a strict duty of confidentiality to all past and present clients (*para 6.3*), which is ongoing and fundamental. You also have a duty of disclosure to your current clients (*para 6.4*). The duty of confidentiality is paramount and takes precedence over the duty of disclosure if they conflict." },
                  { title: "Duty to the Court", content: "Your duty to the court to act with independence in the interests of justice overrides any conflicting duties to your client (*Principle 1*). You must not knowingly or recklessly mislead the court." }
              ]
          }
      ]
  }
};

// CANONICAL SUBJECT LIST - matches Question entity exactly
const ALL_SUBJECTS = [
  "Business Law & Practice",
  "Contract Law",
  "Tort Law",
  "Dispute Resolution",
  "Property Practice",
  "Land Law",
  "Wills & Administration of Estates",
  "Trusts",
  "Criminal Law",
  "Criminal Practice",
  "Solicitors Accounts",
  "Constitutional & Administrative Law",
  "EU Law",
  "The Legal System of England & Wales",
  "Legal Services",
  "Ethics & Professional Conduct"
];

export default function BlackLetterLaw() {
    const [subject, setSubject] = useState('Contract Law');
    const pageData = BLACK_LETTER_LAW_DATA[subject] || BLACK_LETTER_LAW_DATA['Contract Law'];

    return (
        <div className="p-6 md:p-10">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
                        <Gavel className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">Black Letter Law</h1>
                    <p className="text-slate-600 text-lg">Core legal principles, statutes, and case law for your revision.</p>
                </div>

                <Card className="mb-8 border-none shadow-lg">
                    <CardContent className="p-6">
                        <Select value={subject} onValueChange={setSubject}>
                            <SelectTrigger className="flex-1 h-12 text-lg">
                                <SelectValue placeholder="Select a subject..." />
                            </SelectTrigger>
                            <SelectContent>
                                {ALL_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <motion.div
                    key={subject}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="grid md:grid-cols-2 gap-6">
                        {pageData.sections.map((section, index) => (
                             <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                                <CardHeader className="flex flex-row items-center gap-4">
                                     <IconWrapper icon={pageData.icon} color={pageData.color} />
                                     <CardTitle className="text-xl font-bold text-slate-900">{section.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 max-h-160 overflow-y-auto pr-2">
                                    <ul className="space-y-4">
                                        {section.points.map((point, pIndex) => (
                                            <li key={pIndex} className="p-4 bg-slate-50/70 rounded-lg">
                                                <p className="font-semibold text-slate-800">{point.title}</p>
                                                <p className="text-sm text-slate-600 mt-1" dangerouslySetInnerHTML={{ __html: point.content.replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
