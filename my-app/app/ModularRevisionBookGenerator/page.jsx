"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const FLK1_SUBJECTS = [
    "Business Law & Practice",
    "Contract Law", 
    "Tort Law",
    "Dispute Resolution",
    "Constitutional & Administrative Law",
    "EU Law",
    "The Legal System of England & Wales",
    "Legal Services",
    "Ethics & Professional Conduct"
];

const FLK2_SUBJECTS = [
    "Property Practice",
    "Land Law",
    "Wills & Administration of Estates",
    "Trusts",
    "Criminal Law",
    "Criminal Practice",
    "Solicitors Accounts"
];

const ALL_BOOKS = [
    ...FLK1_SUBJECTS.map(s => ({ subject: s, flk: 'FLK 1' })),
    ...FLK2_SUBJECTS.map(s => ({ subject: s, flk: 'FLK 2' }))
];

export default function ModularRevisionBookGenerator() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [currentBook, setCurrentBook] = useState(null);
    const [currentChapter, setCurrentChapter] = useState(0);
    const [totalChapters, setTotalChapters] = useState(0);
    const [generatedBooks, setGeneratedBooks] = useState([]);
    const [chapterContent, setChapterContent] = useState([]);
    const [errors, setErrors] = useState([]);
    const [progress, setProgress] = useState(0);
    const [creditsUsed, setCreditsUsed] = useState(0);
    const [resumeData, setResumeData] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await base44.auth.me();
                setUser(currentUser);
                
                // Check for saved progress
                const saved = localStorage.getItem('bookGenProgress');
                if (saved) {
                    const data = JSON.parse(saved);
                    setResumeData(data);
                }
            } catch (e) {
                setUser(null);
            }
            setLoading(false);
        };
        fetchUser();
    }, []);
    
    useEffect(() => {
        // Save progress to localStorage
        if (generating) {
            localStorage.setItem('bookGenProgress', JSON.stringify({
                generatedBooks,
                creditsUsed,
                currentBookIndex: generatedBooks.length
            }));
        }
    }, [generating, generatedBooks, creditsUsed]);

    const generateChapter = async (book, chapterNum, chapterPrompt) => {
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            try {
                const response = await base44.integrations.Core.InvokeLLM({
                    prompt: chapterPrompt,
                    add_context_from_internet: false
                });

                const wordCount = response.split(/\s+/).length;
                
                // Validate minimum word count for chapter (more lenient)
                const minWords = chapterNum <= 3 ? 800 : 500;
                
                if (wordCount < minWords) {
                    throw new Error(`Chapter too short: ${wordCount} words (minimum ${minWords} required)`);
                }

                return { content: response, wordCount };
            } catch (error) {
                retryCount++;
                if (retryCount < maxRetries) {
                    const waitTime = 10000 * retryCount;
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                    throw error;
                }
            }
        }
    };

    const generateBookModular = async (book) => {
        setCurrentBook(book);
        setChapterContent([]);
        
        const chapters = [
            {
                name: 'Introduction',
                minWords: 2000,
                prompt: `Write Chapter 1: Introduction to ${book.subject} (SQE1 ${book.flk})

🚨 TEXTBOOK-QUALITY CHAPTER: 2,000-2,500 WORDS 🚨

WRITING STYLE: Academic yet accessible. Use formal legal language appropriate for textbooks. Include numbered sections, subheadings, and structured paragraphs. This is a COMPLETE TEXTBOOK CHAPTER, not revision notes.

Cover these areas with full academic rigour:

1. **What ${book.subject} Covers** (500 words)
Write a comprehensive essay explaining ALL topics, principles, and areas within ${book.subject} as defined by the SRA Assessment Specification and KAPLAN syllabus. List every major topic area that will be covered in this book. Discuss the scope, boundaries, and key themes. Provide specific examples of issues that fall within this subject. Explain how the subject is structured according to the official SRA requirements. Include 3-4 realistic client scenarios that solicitors encounter in this area (e.g., "A client comes to your firm wanting to...").

CRITICAL: Reference the SRA Assessment Specification structure and confirm this book will cover ALL required elements for ${book.subject}.

2. **Importance for SQE1 and Legal Practice** (400 words)
Write a detailed analysis of why this subject matters. Discuss real-world applications and career implications. CRITICAL: Include 5+ specific examples of how solicitors use this knowledge daily in practice. Describe typical client instructions, advice scenarios, and transactional work. Make this practical and relatable to trainee solicitors.

3. **Connections to Other SQE Subjects** (400 words)
Write a thorough explanation of how ${book.subject} overlaps with and relates to other legal subjects. Include a comparison table showing where concepts overlap and diverge. Discuss integrated learning opportunities and cross-subject exam questions that combine multiple areas.

4. **What Examiners Are Looking For** (400 words)
Write a comprehensive guide to exam expectations. Detail specific marking criteria and characteristics of strong answers. CRITICAL: Include 3 examples of "trap" scenarios where candidates commonly get confused (e.g., "Many candidates confuse X with Y because..."). Explain the subtle differences and how to avoid these traps.

5. **Strategic Approach** (300 words)
Write detailed study methods, time management strategies, and revision techniques. Include a comparative analysis of different study approaches (e.g., case-led vs statute-led learning) for this subject.

6. **Chapter Summary & Learning Objectives** (100 words)
End with a concise summary of key points and list 5-6 specific learning objectives students should achieve from this book.

WRITING REQUIREMENTS:
- British English only (organisation, judgement, favour, claimant, solicitor)
- Academic textbook style with formal structure
- Complete paragraphs with topic sentences
- Proper legal citation format throughout
- Engage readers like a published legal textbook would
- Include cross-references to later chapters where relevant`
            },
            {
                name: 'Legislative Framework',
                minWords: 2000,
                prompt: `Write Chapter 2: Legislative Framework for ${book.subject} (SQE1 ${book.flk})

🚨 TEXTBOOK-QUALITY CHAPTER: 2,000-2,500 WORDS 🚨

WRITING STYLE: Formal academic legal textbook. Use structured sections with numbered paragraphs. Include proper statutory citations. This should read like a chapter from a commercial law textbook.

1. **Overview of Relevant Statutes** (400 words)
List and explain ALL relevant statutes for ${book.subject}. For each statute, write a full paragraph explaining its scope, purpose, and relevance. Include real-world examples of when solicitors advise clients using each statute.

2. **Detailed Statutory Analysis** (1,000 words)
Choose 5-7 of the most important statutes. For EACH statute, write 150-200 words covering:
- The purpose and context of the statute
- Key sections with detailed explanations
- Any amendments and their impact
- CRITICAL: 2-3 realistic solicitor scenarios showing how to apply this statute in practice (e.g., "Your client runs a business and needs advice on...")
- Common exam trap: Highlight one confusing aspect and explain the distinction clearly

3. **Statutory Hierarchy and Interaction** (300 words)
Write a comprehensive analysis of how these statutes work together. Create a comparison table showing overlaps and conflicts. Explain which takes precedence and why. Include a real-world scenario where multiple statutes apply simultaneously and how to navigate this.

4. **Statutory Interpretation Principles** (200 words)
Explain interpretation approaches specific to ${book.subject}. CRITICAL: Provide 2 exam-style scenarios where candidates must choose between literal vs purposive interpretation, with detailed explanations of why one is correct.

5. **Common Exam Traps** (100 words)
List 3-4 specific statutory interpretation traps in SQE1 exams for this subject. Explain the misconception and the correct approach for each.

6. **Chapter Summary** (100 words)
Provide a structured summary of all statutes covered, their purposes, and key sections. Include a self-test checklist.

WRITING REQUIREMENTS:
- British English and formal legal terminology
- Academic textbook style with structured sections
- Proper statutory citations: e.g., "Section 2(1) of the [Act Year]"
- Quote key statutory wording in quotation marks
- Cross-reference related chapters
- Include footnotes or notes on important amendments`
            },
            {
                name: 'Case Law Foundations',
                minWords: 2000,
                prompt: `Write Chapter 3: Case Law Foundations for ${book.subject} (SQE1 ${book.flk})

🚨 TEXTBOOK-QUALITY CHAPTER: 2,000-2,500 WORDS 🚨

WRITING STYLE: Academic legal textbook focusing on case law. Use formal legal analysis. Structure each case analysis consistently. Include proper legal citations and judicial reasoning. Write as if this will be published by Oxford or Cambridge University Press.

1. **Supreme Court and House of Lords Landmark Cases** (900 words)
Identify 5-7 landmark cases. For EACH case, write 120-150 words covering:
- Full citation: [Name] [Year] [Court] [Law Report]
- Facts: What happened, who were the parties
- Legal issue: The question before the court
- Held: The court's decision
- Ratio decidendi: The binding legal principle
- Significance: Why this case matters for ${book.subject}
- SQE application: How this appears in exam questions
- CRITICAL: Solicitor scenario - Describe how this case would affect advice to a client today
- Common trap: Identify one similar case that candidates confuse with this one and explain the key distinguishing factor

2. **Court of Appeal Key Authorities** (600 words)
Identify 4-5 important Court of Appeal cases. For each, write 120-150 words with the same structure as above, including the solicitor scenario and common trap elements.

3. **Comparative Case Analysis** (250 words)
Create a comparison table of 3-4 similar cases that are frequently confused in SQE1 exams. For each pair/group, explain the subtle differences and provide memory aids to distinguish them.

4. **Evolution of the Law** (150 words)
Trace how the law in ${book.subject} has evolved through key cases. Highlight where older precedents have been overruled or distinguished, and explain the practical implications for solicitors today.

5. **Common Law vs Statute Interaction** (100 words)
Explain how case law and statutory provisions interact. Include an exam trap scenario where candidates must decide whether to apply the statute or the common law rule.

6. **Chapter Summary & Case Law Index** (150 words)
Provide a structured summary with a table of all cases covered: Name | Year | Court | Key Principle. Add 5 self-assessment questions.

WRITING REQUIREMENTS:
- British English with formal legal style
- Proper case citations: [Name] [Year] [Court] [Law Reports]
- Quote key passages from judgments in quotation marks
- Use terms like "held," "ratio decidendi," "obiter dicta" correctly
- Academic analysis of judicial reasoning
- Cross-reference relevant statutory provisions
- Include paragraph numbers for easy reference
- Write with the authority and thoroughness of a leading legal textbook`
            }
        ];

        // Add 25 substantive law topic chapters - each covering ONE major topic area with ALL its subtopics
        for (let i = 1; i <= 25; i++) {
            chapters.push({
                name: `Topic ${i}`,
                minWords: 2000,
                prompt: `Write a COMPLETE TOPIC CHAPTER for ${book.subject} (Topic ${i} of 25)

            🚨 CRITICAL: COVER ONE MAJOR TOPIC AREA WITH ALL 10-15 SUBTOPICS 🚨
            🚨 TEXTBOOK-QUALITY SUBSTANTIVE CHAPTER: 2,000-2,500 WORDS 🚨
            🚨 MUST INCLUDE 5+ SCENARIO-BASED MCQs WITH A-E ANSWERS 🚨

MANDATORY STRUCTURE: 
1. This chapter covers ONE major topic area from the SRA Assessment Specification for ${book.subject}
2. Within this topic area, you MUST cover ALL 10-15 examinable subtopics listed in the SRA/KAPLAN specification
3. Each subtopic must be explained with sufficient depth (150-200 words per subtopic minimum)

IMPORTANT: The SRA specification organizes ${book.subject} into major topic areas, each with 10-15 subtopics. For example:
- If the major area is "Formation of Contract", subtopics include: offer, acceptance, consideration, intention to create legal relations, certainty, capacity, formalities, etc.
- You must cover EVERY subtopic within the chosen major area

SYSTEMATIC COVERAGE: Choose the next major topic area from the SRA Assessment Specification that hasn't been covered in previous chapters. List all its subtopics at the start, then systematically cover each one.

🚨 ZERO PLAGIARISM REQUIREMENT 🚨
- INVENT all names: use fictional characters like "Emma Thompson," "Sarah Chen," "Tech Solutions Ltd," "Green Energy Corp"
- CREATE completely original scenarios from scratch
- MAKE UP all dates, amounts, locations, contract terms
- Apply REAL legal principles to FICTIONAL situations only
- DO NOT copy from textbooks, case reports, or study guides
- Every example must be 100% original and invented by you

WRITING STYLE: Professional legal textbook style with formal academic language, proper legal terminology, and structured analysis. Use numbered paragraphs for easy reference.

Structure:

**A. MAJOR TOPIC AREA & ALL SUBTOPICS** (200 words)
State which major topic area from the SRA Assessment Specification this chapter covers. List ALL 10-15 examinable subtopics within this area according to SRA/KAPLAN requirements. Create a numbered list confirming you will cover every single subtopic comprehensively.

Example format:
"This chapter covers [MAJOR AREA] which includes these subtopics:
1. [Subtopic 1]
2. [Subtopic 2]
... [continue for all 10-15 subtopics]"

**B. COMPREHENSIVE SUBTOPIC COVERAGE** (1,500-1,800 words total - 150-180 words per subtopic)

For EACH of the 10-15 subtopics, provide a complete analysis following this structure:

**[SUBTOPIC NAME]**
- Black letter law rules (what is the rule?)
- Elements/requirements (what must be satisfied?)
- Relevant statutes (which sections apply? Quote key text)
- Key cases (2-3 cases with: citation, facts, ratio, application)
- Practical application (1-2 COMPLETELY ORIGINAL fictional solicitor scenarios with invented names, companies, and situations - e.g., "Zara Khan operates a fictional business called 'Urban Designs Co' and seeks advice on...")
- Exam traps (what do candidates commonly confuse this with?)

CRITICAL: You MUST cover every single subtopic listed in section A. Do not skip any. Each subtopic requires 150-180 words of detailed analysis.

**C. INTEGRATED SCENARIO-BASED MCQ PRACTICE** (400 words minimum)

Provide 5-7 COMPLETELY ORIGINAL SQE-style scenario-based MCQs using invented scenarios, fictional client names, and made-up companies. 

For EACH question, use this exact format:

**Question [X]:** [Write a 100-150 word realistic client scenario - e.g., "Sarah Chen, a solicitor, is advising Tech Solutions Ltd on..." Include all relevant facts, dates, amounts, parties involved]

Which of the following is the BEST answer?

A) [Option A - make it plausible but incorrect for a specific legal reason]
B) [Option B - make it plausible but incorrect for a specific legal reason]
C) [Option C - THE CORRECT ANSWER - legally accurate and best fits the scenario]
D) [Option D - make it plausible but incorrect for a specific legal reason]
E) [Option E - make it plausible but incorrect for a specific legal reason]

**ANSWER: C**

**DETAILED EXPLANATION & APPROACH:**

*Step 1: Identify the Legal Issue* - [Explain what area of law this tests - 50 words]

*Step 2: Extract Key Facts* - [List the critical facts from the scenario - 50 words]

*Step 3: Apply the Law* - [Explain which legal rule/case/statute applies and why - 100 words]

*Step 4: Eliminate Wrong Answers:*
- Option A is wrong because: [specific reason - 30 words]
- Option B is wrong because: [specific reason - 30 words]
- Option D is wrong because: [specific reason - 30 words]
- Option E is wrong because: [specific reason - 30 words]

*Step 5: Why C is the BEST answer:* [Explain why C is not just correct, but the BEST answer in this scenario - 50 words]

**EXAMINER'S TIP:** [One sentence on what trap to avoid or what candidates commonly get wrong]

ZERO PLAGIARISM: all scenarios, names, companies, dates must be invented. Test multiple subtopics from this chapter together.

**D. CHAPTER SUMMARY & SPECIFICATION CHECKLIST** (150 words)
Create a checklist table showing:
**Subtopic** | **Key Rule** | **Main Case(s)** | **Main Statute(s)** | **✓ Covered**

Then provide 5 self-test questions covering different subtopics from this chapter.

CRITICAL COVERAGE REQUIREMENTS:
- This chapter MUST systematically cover ONE complete major topic area with ALL its subtopics from the SRA specification
- The SRA/KAPLAN syllabus for ${book.subject} is organized into major areas, each with 10-15 specific subtopics
- Every single subtopic must be addressed - NO gaps allowed
- Across all 25 chapters, every examinable point in the entire ${book.subject} specification will be covered
- Each chapter = 1 major area = 10-15 subtopics fully explained

WRITING REQUIREMENTS:
- British English: organisation, judgement, favour, defence, claimant, solicitor
- Formal academic legal textbook style
- Proper citations for all cases and statutes
- Structured numbered paragraphs (1.1, 1.2, etc.)
- Use legal terminology correctly
- Quote key legal wording directly
- Cross-reference related subtopics within the chapter
- Write as comprehensively as a Blackstone's or Smith & Keenan textbook
- Include worked examples with full legal analysis
- Ensure 2,000-2,500 words to properly cover all 10-15 subtopics`
            });
        }

        // Add comprehensive coverage verification chapter
        chapters.push({
            name: 'SRA Specification Coverage Map',
            minWords: 800,
            prompt: `Write Chapter ${chapters.length + 1}: SRA Specification Coverage Map & Verification for ${book.subject}

🚨 CRITICAL VERIFICATION CHAPTER: 1,500-2,000 WORDS 🚨
🚨 USE MOST CURRENT 2024-2025 SRA ASSESSMENT SPECIFICATION 🚨

WRITING STYLE: Comprehensive reference chapter with dynamic verification metrics.

**SECTION 1: Current SRA/KAPLAN Specification Analysis** (300 words)

Reference the MOST CURRENT SRA Assessment Specification for ${book.subject} (2024-2025 edition). State:
- Official SRA specification version/date
- Total number of major topic areas defined by SRA
- Average number of subtopics per major area
- Any recent updates or changes to the specification
- KAPLAN alignment confirmation

**SECTION 2: Complete Topic Area & Subtopic Coverage Map** (700 words)

Create a comprehensive verification table for EACH major topic area in ${book.subject} per the current SRA specification:

**Major Topic Area** | **Chapter(s)** | **ALL Subtopics (List 10-15)** | **Coverage %** | **Key Cases** | **Key Statutes** | **Verification ✓**

For EACH row:
- List the official SRA major topic name exactly as in specification
- Map to the specific chapter(s) in this book
- List ALL subtopics within that area (10-15 per the SRA spec)
- Calculate coverage percentage (e.g., "15/15 subtopics = 100%")
- List 3-5 key cases covered
- List 2-4 key statutes covered
- Checkmark if fully covered

Example:
| Formation of Contract | Ch 4 | 1. Offer 2. Acceptance 3. Consideration 4. ICLR 5. Certainty 6. Capacity 7. Formalities 8. Privity 9. Third party rights 10. Duress 11. Undue influence 12. Misrepresentation | 12/12 = 100% | Carlill, Entores, Williams v Roffey | Contracts Act 1999, Sale of Goods Act 1979 | ✓ |

**SECTION 3: Dynamic Verification Score** (200 words)

Calculate and display:

**OVERALL SPECIFICATION COVERAGE SCORE**
- Total SRA-defined subtopics for ${book.subject}: [X]
- Subtopics covered in this book: [Y]
- **Coverage Score: [Y/X × 100]%**
- Missing/Undercovered areas (if any): [list or "None - 100% complete"]

**COVERAGE BREAKDOWN BY MAJOR AREA:**
Create a visual score for each major area:
- Area 1: ████████░░ 80%
- Area 2: ██████████ 100%
[Continue for all areas]

**SECTION 4: Common Examiner Pitfalls & High-Risk Areas** (300 words)

Based on SRA examiner reports and KAPLAN analysis, identify:

**4.1 Top 5 Areas Where Candidates Historically Struggle:**
For each area, provide:
- Subtopic name (e.g., "Statutory Interpretation in [Subject]")
- Why candidates fail (e.g., "Confuse literal vs purposive approaches")
- Where covered in this book (chapter reference)
- Key distinction to master
- Practice tip

**4.2 Frequently Tested Traps:**
List 5-7 specific exam traps per SRA reports:
- Trap: [Description]
- Why it catches candidates: [Explanation]
- Correct approach: [How to avoid]
- Book reference: [Chapter covering this]

**4.3 High-Frequency Exam Topics:**
List 8-10 subtopics that appear MOST frequently in SQE1 exams per SRA data, with chapter references.

**SECTION 5: Zero Plagiarism Verification** (50 words)

Confirm that all scenarios, examples, and client names throughout this book are 100% ORIGINAL and INVENTED. No copying from textbooks, case reports, or other sources. Real law applied to fictional situations only.

**SECTION 6: Final Checklist for Students** (100 words)

✓ Verified: All [X] major SRA topic areas covered
✓ Verified: All [Y] official SRA subtopics addressed  
✓ Verified: 100% specification compliance achieved
✓ Verified: All examiner pitfall areas included
✓ Verified: Zero plagiarism - all examples original
✓ Verified: Textbook-quality academic writing throughout
✓ Ready for SQE1 examination

**Student Self-Assessment:** Use this map to tick off each subtopic as you master it. Aim for 100% understanding across all areas before exam day.`
        });

        // Add final chapters
        chapters.push({
            name: 'Scenario-Based MCQ Mastery',
            minWords: 1500,
            prompt: `Write Chapter 28: Mastering Scenario-Based MCQs for ${book.subject}

        🚨 COMPLETE MCQ STRATEGY CHAPTER: 1,500-2,000 WORDS 🚨

        WRITING STYLE: Clear, practical, actionable. This chapter teaches students EXACTLY how to approach SQE1 scenario-based questions.

        **SECTION 1: Understanding SQE1 Scenario Questions** (300 words)

        Explain:
        - What makes a question "scenario-based" vs "knowledge-based"
        - Why SQE1 uses scenarios (testing application, not just recall)
        - Common scenario types in ${book.subject} (client advice, transactional, procedural, ethical)
        - The "single best answer" format - why there may be multiple "correct" answers, but only ONE is BEST
        - How ${book.subject} scenarios differ from other subjects

        **SECTION 2: The 5-Step Method for Scenario Questions** (400 words)

        Teach a systematic approach:

        **Step 1: Read the Question Stem FIRST** (50 words)
        - Why you should read "Which of the following..." BEFORE the scenario
        - How this focuses your reading

        **Step 2: Extract Key Facts While Reading** (100 words)
        - What facts matter in ${book.subject} scenarios
        - How to spot red herrings and distractors
        - Mental highlighting technique
        - Example: [Show a sample scenario with key facts highlighted]

        **Step 3: Identify the Legal Issue** (100 words)
        - Keyword recognition for ${book.subject}
        - Common issue patterns in SQE1 for this subject
        - How to classify the question type in 5 seconds

        **Step 4: Apply the Law to Facts** (100 words)
        - Which statute/case/rule applies?
        - Map facts to legal elements
        - Consider all relevant factors

        **Step 5: Eliminate and Select Best Answer** (50 words)
        - Process of elimination technique
        - How to choose between 2 similar options
        - Trust your analysis, not your gut

        **SECTION 3: Common Traps in ${book.subject} Scenarios** (300 words)

        Identify 5-7 specific traps:

        **Trap 1: [Name the trap]**
        - What it looks like: [Description]
        - Why candidates fall for it: [Psychology]
        - How to avoid: [Strategy]
        - Example: [Brief scenario showing this trap]

        [Repeat for all 5-7 traps specific to ${book.subject}]

        **SECTION 4: Worked Examples - The Method in Action** (500 words)

        Provide 3 COMPLETE scenario-based questions showing the 5-step method:

        For EACH question:

        **QUESTION [X]:**
        [150-word realistic scenario using invented names, companies, facts]

        Which of the following is the BEST answer?
        A) [Plausible but wrong]
        B) [Plausible but wrong]
        C) [CORRECT]
        D) [Plausible but wrong]
        E) [Plausible but wrong]

        **WORKING THROUGH THE 5 STEPS:**

        *Step 1: Question stem asks:* [What we're looking for]

        *Step 2: Key facts:*
        - [Fact 1]
        - [Fact 2]
        - [Fact 3]
        [Also note: Facts that DON'T matter]

        *Step 3: Legal issue:* [Identify the specific point of law being tested]

        *Step 4: Apply law:* [Which rule applies and how]

        *Step 5: Eliminate and select:*
        - A is wrong because: [specific reason]
        - B is wrong because: [specific reason]
        - D is wrong because: [specific reason]
        - E is wrong because: [specific reason]
        - **C is BEST because:** [detailed explanation of why C is superior]

        **WHY THIS MATTERS:** [Connect to real solicitor work]

        ZERO PLAGIARISM: All scenarios must be completely invented.

        **SECTION 5: Practice Under Time Pressure** (100 words)
        - How much time per question (105 seconds average)
        - When to flag and move on
        - How to maintain accuracy while speeding up
        - Final exam day tips specific to ${book.subject}

WRITING REQUIREMENTS:
- British English throughout
- Professional, confident tone like an experienced examiner
- Structured approach with clear numbered sections
- Practical, actionable advice
- Reference specific chapters and topics from earlier in the book
- Include statistical information where relevant
- Write as authoritatively as an SRA-approved prep guide
- Make this a true exam masterclass chapter worthy of a published textbook`
        });

        setTotalChapters(chapters.length);
        console.log(`Total chapters for ${book.subject}: ${chapters.length}`);

        const allContent = [];

        for (let i = 0; i < chapters.length; i++) {
            setCurrentChapter(i + 1);
            setProgress(((i + 1) / chapters.length) * 100);

            try {
                const result = await generateChapter(book, i + 1, chapters[i].prompt);
                allContent.push(`\n\n## ${chapters[i].name}\n\n${result.content}`);
                setChapterContent([...allContent]);
                setCreditsUsed(prev => prev + 1);
            } catch (error) {
                throw new Error(`Failed on chapter ${chapters[i].name}: ${error.message}`);
            }

            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        return allContent.join('\n\n');
    };

    const generateSingleBook = async (bookIndex) => {
        setGenerating(true);
        setProgress(0);
        
        const book = ALL_BOOKS[bookIndex];

        try {
            const existingBooks = await base44.entities.RevisionBook.filter({ 
                subject: book.subject, 
                flk_type: book.flk 
            });
            
            if (existingBooks.length > 0) {
                setGeneratedBooks(prev => [...prev, { 
                    ...book, 
                    status: 'skipped', 
                    message: 'Already exists' 
                }]);
                setGenerating(false);
                setCurrentBook(null);
                return;
            }

            const fullContent = await generateBookModular(book);
            const totalWords = fullContent.split(/\s+/).length;

            // Validate comprehensive coverage: 30 chapters with proper depth
            // Expected: ~50,000-60,000 words total for full SRA coverage
            if (totalWords < 45000) {
                throw new Error(`Book needs more depth: ${totalWords} words (needs 45k+ for complete SRA/KAPLAN coverage of all subtopics)`);
            }

            await base44.entities.RevisionBook.create({
                title: `${book.subject} - Complete Revision Guide`,
                subject: book.subject,
                flk_type: book.flk,
                content: fullContent,
                summary: `Comprehensive revision guide covering all principles in ${book.subject}. Modular generation ensures quality and depth.`,
                page_count_estimate: Math.round(totalWords / 300)
            });

            setGeneratedBooks(prev => [...prev, { 
                ...book, 
                status: 'success', 
                message: `Generated successfully (${totalWords.toLocaleString()} words)` 
            }]);

        } catch (error) {
            setErrors(prev => [...prev, { ...book, error: error.message }]);
            setGeneratedBooks(prev => [...prev, { 
                ...book, 
                status: 'error', 
                message: error.message 
            }]);
        }

        setGenerating(false);
        setCurrentBook(null);
    };
    
    const getNextBookIndex = () => {
        return generatedBooks.length;
    };
    
    const hasMoreBooks = () => {
        return generatedBooks.length < ALL_BOOKS.length;
    };

    if (loading) {
        return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-500" /></div>;
    }

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <Card className="max-w-md text-center p-8">
                    <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Admin Only</h1>
                    <p className="text-slate-600 mt-2">This tool is for administrators only.</p>
                    <Link href={createPageUrl("Dashboard")}>
                        <Button variant="outline" className="mt-6">Return to Dashboard</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">Modular Revision Book Generator</h1>
                    <p className="text-slate-600 text-lg">High-quality books generated chapter-by-chapter</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <Alert className="bg-blue-50 border-blue-200">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        <AlertTitle className="text-blue-900 font-bold">Complete SRA/KAPLAN Coverage</AlertTitle>
                        <AlertDescription className="text-blue-800">
                            30 chapters per book covering EVERY major topic area (each with 10-15 subtopics) from SRA/KAPLAN specification. 45,000-60,000 words per book.
                            <br/><br/>
                            <strong>Structure:</strong> 3 foundation + 25 major topics (10-15 subtopics each) + coverage map + exam technique
                            <br/>
                            <strong>Time:</strong> ~12-15 min per book | <strong>Cost:</strong> ~30 credits/book
                        </AlertDescription>
                    </Alert>
                    
                    <Card className="border-2 border-purple-300 bg-purple-50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-purple-900">AI Credits Used</span>
                                <span className="text-2xl font-bold text-purple-900">{creditsUsed}</span>
                            </div>
                            <Progress value={(creditsUsed / 10000) * 100} className="h-2 bg-purple-200" />
                            <p className="text-xs text-purple-700 mt-2">Budget: ~480 credits (16 books × 30 credits)</p>
                        </CardContent>
                    </Card>
                </div>
                


                {!generating && (
                    <Card className="border-none shadow-xl">
                        <CardContent className="p-10">
                            <div className="text-center mb-8">
                                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-6" />
                                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                                    {generatedBooks.length === 0 ? 'Ready to Generate Books One at a Time' : `Progress: ${generatedBooks.length} / ${ALL_BOOKS.length} Books`}
                                </h2>
                                <p className="text-slate-600 mb-6">
                                    Each book: 45,000-60,000 words, 30 chapters covering EVERY major topic area with ALL subtopics from SRA/KAPLAN specification. Generate one at a time—progress saves automatically.
                                </p>
                            </div>

                            {hasMoreBooks() ? (
                                <div className="space-y-4">
                                    <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                                        <h3 className="font-bold text-blue-900 text-lg mb-2">
                                            Next: {ALL_BOOKS[getNextBookIndex()].subject}
                                        </h3>
                                        <p className="text-blue-700 text-sm mb-4">
                                            {ALL_BOOKS[getNextBookIndex()].flk} • 30 chapters • 45k-60k words • All SRA subtopics • ~30 credits • 12-15 min
                                        </p>
                                        <Button 
                                            onClick={() => generateSingleBook(getNextBookIndex())}
                                            className="w-full bg-slate-900 hover:bg-slate-800 h-12"
                                        >
                                            <Sparkles className="w-5 h-5 mr-2" />
                                            Generate This Book
                                        </Button>
                                    </div>
                                    
                                    <Link href={createPageUrl("RevisionBooks")} className="block">
                                        <Button variant="outline" className="w-full">
                                            View Generated Books
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-slate-900 mb-4">All Books Generated!</h3>
                                    <Link href={createPageUrl("RevisionBooks")}>
                                        <Button className="bg-slate-900 hover:bg-slate-800">
                                            View All Books
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {generating && (
                    <div className="space-y-6">
                        <Card className="border-none shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Generating: {currentBook?.subject}</span>
                                    <span className="text-lg text-slate-600">
                                        Chapter {currentChapter}/{totalChapters}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Progress value={progress} className="h-3" />
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-600 mb-2" />
                                    <p className="text-sm text-slate-600">
                                        Generating chapter {currentChapter}... This ensures quality content.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {chapterContent.length > 0 && (
                            <Card className="border-none shadow-xl">
                                <CardHeader>
                                    <CardTitle>Generated Content Preview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-slate-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                            {chapterContent.join('\n\n').substring(0, 2000)}...
                                        </p>
                                        <p className="text-xs text-slate-500 mt-4">
                                            Total words so far: {chapterContent.join(' ').split(/\s+/).length.toLocaleString()}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="border-none shadow-xl">
                            <CardHeader>
                                <CardTitle>Progress Log</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {generatedBooks.map((book, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            {book.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                            {book.status === 'skipped' && <AlertCircle className="w-5 h-5 text-blue-500" />}
                                            {book.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                                            <div className="flex-1">
                                                <p className="font-medium">{book.subject} ({book.flk})</p>
                                                <p className="text-sm text-slate-600">{book.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {!generating && generatedBooks.length > 0 && (
                    <div className="space-y-6">
                        <Card className="border-none shadow-xl bg-linear-to-br from-green-50 to-emerald-50">
                            <CardContent className="p-10 text-center">
                                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Generation Complete!</h2>
                                <p className="text-slate-600 mb-6">
                                    Successfully processed {generatedBooks.length} books.
                                </p>
                                <div className="flex gap-4 justify-center">
                                    <Link href={createPageUrl("RevisionBooks")}>
                                        <Button className="bg-slate-900 hover:bg-slate-800">
                                            View Revision Books
                                        </Button>
                                    </Link>
                                    <Button variant="outline" onClick={() => window.location.reload()}>
                                        Generate More
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl">
                            <CardHeader>
                                <CardTitle>Final Results</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {generatedBooks.map((book, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            {book.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                            {book.status === 'skipped' && <AlertCircle className="w-5 h-5 text-blue-500" />}
                                            {book.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                                            <div className="flex-1">
                                                <p className="font-medium">{book.subject} ({book.flk})</p>
                                                <p className="text-sm text-slate-600">{book.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}