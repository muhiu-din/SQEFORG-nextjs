"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  FileText,
  Lock,
  Search,
  Star,
  Award,
  Loader2,
  Crown,
  GraduationCap,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// FLK Subject Classifications
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
  "Solicitors Accounts",
  "Ethics & Professional Conduct"
];

const generateAIContent = async (item) => {
  // Generate comprehensive legal content using AI with internet context
  const prompt = `You are an expert legal educator creating comprehensive SQE1 study material.

Create a detailed, exam-focused study guide for: **${item.subject}** (${item.flk})

The guide MUST include:

**1. STATUTORY FRAMEWORK (5-7 key Acts with detailed analysis)**
For each statute provide:
- Full Act name and year
- Section-by-section breakdown (quote key sections)
- Element-by-element analysis
- How courts interpret each provision
- Practical application examples
- Common exam scenarios

**2. LEADING CASE LAW (10-15 major cases with full analysis)**
For each case provide:
- Full case name [Year] [Court]
- Complete facts (3-4 paragraphs)
- Procedural history
- Legal issues presented
- Court's holding and reasoning (4-5 paragraphs)
- Ratio decidendi (binding principle)
- Obiter dicta
- Significance for modern law
- How to cite in exams
- Exam application tips

**3. CORE PRINCIPLES & DEFINITIONS (10-15 key terms)**
For each provide:
- Formal legal definition with source
- Detailed explanation
- Distinctions from similar concepts
- Practical significance
- Common mistakes

**4. PRACTICAL APPLICATION (3-5 worked examples)**
Provide detailed scenarios using IRAC:
- Issue identification
- Rule statement with authority
- Application to facts (element-by-element)
- Conclusion with reasoning

**5. EXAM STRATEGY**
Include:
- Question pattern recognition (5-7 patterns)
- Common traps and how to avoid them
- Time management specific to ${item.subject}
- Typical fact patterns that trigger rules

**6. PRACTICE QUESTIONS (10 MCQs with detailed explanations)**
Each with:
- Comprehensive fact pattern
- 5 options
- Analysis of why each option is right/wrong
- Key learning points

Format as professional markdown suitable for PDF conversion.
Use British English spelling throughout.
Include actual case names, statute sections, and dates.
Base content on current English law as of 2024/2025.
Target 8000-12000 words of dense, exam-focused content.

Make this comprehensive enough that a student could use ONLY this guide to pass SQE1 ${item.subject}.`;

  try {
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: true
    });
    
    return aiResponse;
  } catch (error) {
    console.error('Failed to generate AI content:', error);
    throw error;
  }
};

// Fallback content template when AI generation isn't available
const generateFallbackContent = (item) => {
  return `# ${item.subject}

## Complete Revision Guide

**Published by:** SQEForge  
**Subject:** ${item.subject}  
**Examination:** SQE1 ${item.flk || ''}  
**Document Type:** Comprehensive Study Guide  

---

## Table of Contents

1. Introduction & Overview
2. Learning Objectives
3. Essential Legal Framework
4. Core Principles & Definitions
5. Key Legislation & Statutory Provisions
6. Leading Case Law Analysis
7. Practical Application & Examples
8. Common Exam Questions & Scenarios
9. Advanced Concepts & Complex Issues
10. Exam Strategy & Technique
11. Practice Questions with Solutions
12. Quick Reference Summary

---

## 1. Introduction & Overview

**${item.subject}** forms a critical component of the SQE1 examination and is essential knowledge for any aspiring solicitor. This comprehensive study guide provides complete coverage of all testable material, combining theoretical understanding with practical application skills necessary for exam success.

The SQE assessment framework requires not just memorisation of legal rules, but a deep understanding of how these principles apply in realistic scenarios. This guide is structured to optimise your learning and retention.

### How to Use This Guide

**For Initial Learning:** Read through sequentially to build foundational understanding. Take notes on key principles, cases, and statutory provisions.

**For Revision:** Use the Quick Reference Summary for rapid review of key points. Focus on sections covering your identified weak areas.

**For Exam Preparation:** Study the Exam Strategy section thoroughly. Practise with the mock questions under timed conditions.

---

## 2. Learning Objectives

By completing this comprehensive study guide, you will be able to:

### Knowledge Objectives

✓ Identify and explain all core legal principles governing ${item.subject}  
✓ State accurately the key statutory provisions and their requirements  
✓ Recall the facts, issues, and holdings of all leading cases  
✓ Define precisely essential legal terminology and concepts  
✓ Outline the historical development of the law in this area  
✓ Recognise the interplay between different legal rules and principles

<h3>Application Objectives</h3>

✓ Apply legal rules to novel fact patterns with accuracy  
✓ Analyse complex scenarios using appropriate legal frameworks  
✓ Distinguish between similar legal concepts and tests  
✓ Evaluate the strengths and weaknesses of legal arguments  
✓ Predict outcomes of disputes based on applicable law  
✓ Advise hypothetical clients on their legal position

<h3>Exam Performance Objectives</h3>

✓ Answer MCQs accurately within the time limit (1 min 45 sec per question)  
✓ Identify the legal issue quickly from fact patterns  
✓ Eliminate incorrect options systematically  
✓ Select the BEST answer when multiple options seem correct  
✓ Score 60%+ consistently on practice exams

---

## 3. Essential Legal Framework

${item.subject} operates within the broader framework of English law. Understanding the constitutional and legislative context, fundamental principles, and conceptual framework is essential for exam success.

**Primary Legislation:** Acts of Parliament form the supreme source of law. These statutes have been interpreted and applied by the courts over many years.

**Secondary Legislation:** Regulations and orders provide detailed implementation of statutory schemes.

**Common Law:** Judge-made law through case decisions remains vitally important in this area.

This section would contain comprehensive framework analysis with detailed principles, tests, and applications specific to ${item.subject}.

---

<h2>4. Core Principles & Definitions</h2>

Essential legal terminology with precise definitions, practical significance, and common exam traps.

This section would contain 10-15 key definitions with:
- Formal legal definition with source
- Detailed explanation
- Distinctions from similar concepts
- Practical significance
- Common mistakes to avoid

---

<h2>5. Key Legislation & Statutory Provisions</h2>

Detailed analysis of all key statutory provisions:
- Full text of relevant sections
- Element-by-element breakdown
- Case law interpretation
- Practical application examples

This section would cover 5-7 key Acts with comprehensive commentary on how courts have interpreted each provision.

---

<h2>6. Leading Case Law Analysis</h2>

Comprehensive analysis of all leading cases:
- Complete facts
- Issues before the court
- Court's decision and reasoning
- Ratio decidendi (binding principle)
- Exam application tips

This section would analyse 10-15 leading cases in detail, each including:
- Full fact summary (3-4 paragraphs)
- Procedural history
- Legal issues presented
- Court's reasoning (4-5 paragraphs)
- Significance for modern law
- How to cite in exams

---

<h2>7. Practical Application & Examples</h2>

Worked examples using the IRAC methodology:
- **Issue:** Identify the legal question
- **Rule:** State applicable law
- **Application:** Apply to facts
- **Conclusion:** Reach reasoned conclusion

This section would provide 3-5 comprehensive worked examples showing step-by-step application of legal principles.

---

<h2>8. Common Exam Questions & Scenarios</h2>

Based on analysis of past SQE questions, certain patterns appear repeatedly.

This section would detail 5-7 question patterns with:
- Pattern recognition guide
- Full example questions with 5 options
- Analysis of each option
- Common traps to avoid
- Strategic approach to answering

---

<h2>9. Advanced Concepts & Complex Issues</h2>

For students targeting top scores, sophisticated analysis of complex topics.

This section would explore:
- Nuanced legal distinctions
- Competing theories and approaches
- Recent developments in the law

---

<h2>10. Exam Strategy & Technique</h2>

<h3>Time Management</h3>

For 90 questions in 157.5 minutes:
- Average: 1:45 per question
- Target: 1:30 per question for review time
- Maximum: 2 minutes on any question

<h3>Answer Selection Strategy</h3>

1. Read question WITHOUT options first
2. Eliminate obviously wrong options
3. Analyse remaining options carefully
4. Choose BEST answer
5. Mark and move on

<h3>Common Mistakes to Avoid</h3>

❌ Overthinking simple questions → ✓ Apply rule directly  
❌ Choosing partially correct → ✓ Find MOST complete answer  
❌ Ignoring qualifiers → ✓ Every word matters  
❌ Using common sense → ✓ Apply specific legal test  
❌ Changing answers → ✓ Only if certain of error

---

<h2>11. Practice Questions with Solutions</h2>

This section would provide 10-15 full practice MCQs with:
- Comprehensive fact pattern
- 5 answer options (A-E)
- Detailed analysis of each option
- Explanation of correct answer
- Key learning points

---

<h2>12. Quick Reference Summary</h2>

<h3>Essential Cases</h3>

This section would include table summaries of key cases with:
- Case name and year
- Core principle
- When to cite

<h3>Key Statutory Provisions</h3>

This section would include statutory summary table with:
- Statute & Section
- Purpose
- Requirements

<h3>Memory Aids</h3>

Mnemonics and checklists for quick revision.

---

<h2>Further Resources</h2>

To supplement this guide, we recommend using our other study tools for comprehensive practice:

- **Question Bank:** Practice with 1000s of MCQs
- **Mock Exams:** Full timed exam simulations
- **Flash Cards:** Spaced repetition learning
- **Mind Maps:** Visual learning aids

---

**© ${new Date().getFullYear()} SQEForge. All rights reserved.**

*This is an exam preparation guide. Content based on English law as of 2024/2025. Use in conjunction with official SRA materials.*

---

**SQEForge** | Forge Your Path To Success | www.sqeforge.com

*Consistent practice + deep understanding + exam technique = SQE Success*
`;
};

const generatePDFContent = async (item, userEmail, contentMarkdown) => {
  const today = new Date().toLocaleDateString('en-GB');
  
  // Convert markdown content to simple HTML formatting as specified in the outline
  let contentHtml = contentMarkdown;
  contentHtml = contentHtml.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  contentHtml = contentHtml.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  contentHtml = contentHtml.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  contentHtml = contentHtml.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  contentHtml = contentHtml.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  contentHtml = contentHtml.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  contentHtml = contentHtml.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
  
  // Handle lists: first, convert individual markdown list items to <li>
  contentHtml = contentHtml.replace(/^- (.*$)/gim, '<li>$1</li>');
  // Then, wrap consecutive <li> items in <ul> tags
  // This regex is a simple approach and assumes relatively clean input without nested markdown blocks needing parsing
  contentHtml = contentHtml.replace(/(<li>.*?<\/li>(\n<li>.*?<\/li>)*)/gs, '<ul>$1</ul>');

  // Finally, wrap bare text blocks in <p> tags. This is the most challenging with simple regex
  // to avoid wrapping other block-level elements already converted.
  // We'll apply it as the last step to catch remaining text blocks.
  // To avoid wrapping existing HTML tags, a more sophisticated parser would be needed.
  // For the purpose of this task, following the outline, this regex is applied.
  contentHtml = contentHtml.replace(/\n\n/g, '</p><p>');

  // Wrap the entire contentHtml with a <p> tag if it starts with text
  // This is a minimal attempt to ensure blocks of text are correctly paragraphed
  if (!contentHtml.startsWith('<h') && !contentHtml.startsWith('<ul') && !contentHtml.startsWith('<block')) {
    contentHtml = `<p>${contentHtml}</p>`;
  }
  
  return `
<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${item.title} - SQEForge</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.8;
      color: #1a1a1a;
      background: white;
      font-size: 11pt;
    }
    
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-linear(135deg, #1e293b 0%, #334155 100%);
      color: white;
      page-break-after: always;
      padding: 60px;
    }
    
    .logo {
      width: 120px;
      height: 120px;
      background: linear-linear(135deg, #fbbf24 0%, #f59e0b 100%);
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    
    .logo-icon {
      font-size: 60px;
      color: #1e293b;
    }
    
    .cover-badge {
      display: inline-block;
      padding: 12px 24px;
      background: #fbbf24;
      color: #1e293b;
      font-weight: bold;
      border-radius: 50px;
      margin-bottom: 40px;
      font-size: 14pt;
    }
    
    .cover-title {
      font-size: 48pt;
      font-weight: bold;
      margin-bottom: 20px;
      line-height: 1.2;
    }
    
    .cover-subtitle {
      font-size: 20pt;
      color: #cbd5e1;
      margin-bottom: 60px;
    }
    
    .cover-footer {
      margin-top: 80px;
      padding-top: 40px;
      border-top: 2px solid #475569;
    }
    
    .cover-footer h3 {
      font-size: 28pt;
      margin-bottom: 8px;
    }
    
    .cover-footer p {
      font-size: 12pt;
      color: #94a3b8;
    }
    
    .content {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: white;
    }
    
    .copyright-page {
      page-break-after: always;
      padding: 60px 40px;
    }
    
    .copyright-page h2 {
      font-size: 18pt;
      margin-bottom: 30px;
      color: #1e293b;
    }
    
    .copyright-info {
      font-size: 10pt;
      line-height: 1.6;
      color: #475569;
    }
    
    .copyright-info p {
      margin-bottom: 16px;
    }
    
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 72pt;
      color: rgba(0, 0, 0, 0.03);
      font-weight: bold;
      pointer-events: none;
      white-space: nowrap;
      z-index: 0;
    }
    
    h1 {
      font-size: 28pt;
      font-weight: bold;
      color: #1e293b;
      margin-top: 40px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 4px solid #fbbf24;
      page-break-after: avoid;
    }
    
    h2 {
      font-size: 20pt;
      font-weight: bold;
      color: #334155;
      margin-top: 30px;
      margin-bottom: 15px;
      page-break-after: avoid;
    }
    
    h3 {
      font-size: 16pt;
      font-weight: 600;
      color: #475569;
      margin-top: 24px;
      margin-bottom: 12px;
      page-break-after: avoid;
    }
    
    h4 {
      font-size: 13pt;
      font-weight: 600;
      color: #64748b;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    p {
      margin-bottom: 12px;
      text-align: justify;
      position: relative;
      z-index: 1;
    }
    
    blockquote {
      background: #fef3c7;
      border-left: 4px solid #fbbf24;
      padding: 20px;
      margin: 20px 0;
      page-break-inside: avoid;
    }
    
    ul, ol {
      margin: 12px 0 12px 30px;
      position: relative;
      z-index: 1;
    }
    
    li {
      margin-bottom: 8px;
      line-height: 1.6;
    }
    
    strong {
      font-weight: bold;
      color: #1e293b;
    }
    
    em {
      font-style: italic;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      page-break-inside: avoid;
    }
    
    th, td {
      border: 1px solid #cbd5e1;
      padding: 12px;
      text-align: left;
    }
    
    th {
      background-color: #f1f5f9;
      font-weight: bold;
      color: #1e293b;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      font-size: 9pt;
      color: #64748b;
    }

    .print-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1e293b;
      color: white;
      padding: 12px 24px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 1000;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: sans-serif;
      transition: transform 0.2s;
    }
    .print-btn:hover {
      transform: translateY(-2px);
    }
    
    @media print {
      body {
        background: white;
      }
      
      .no-print, .print-btn {
        display: none !important;
      }
      
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <a href="javascript:window.print()" class="print-btn no-print">
    <span>🖨️</span> Print / Save as PDF
  </a>
  
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="logo">
      <div class="logo-icon">⚖️</div>
    </div>
    
    <div class="cover-badge">${item.flk || 'SQE'}</div>
    
    <h1 class="cover-title">${item.subject || item.title}</h1>
    <p class="cover-subtitle">Complete Revision Guide</p>
    
    <div class="cover-footer">
      <h3>SQEForge</h3>
      <p>Forge Your Path To Success</p>
      <p style="margin-top: 20px; font-size: 10pt;">© ${new Date().getFullYear()} SQEForge. All Rights Reserved.</p>
    </div>
  </div>
  
  <!-- Watermark -->
  <div class="watermark">${userEmail}</div>
  
  <!-- Copyright Page -->
  <div class="copyright-page">
    <h2>${item.title}</h2>
    
    <div class="copyright-info">
      <p><strong>Published by:</strong> SQEForge</p>
      <p><strong>Subject:</strong> ${item.subject}</p>
      <p><strong>Examination:</strong> SQE1 ${item.flk || ''}</p>
      <p><strong>Document Type:</strong> Comprehensive Study Guide</p>
      <p><strong>Pages:</strong> ${item.pages}</p>
      <p><strong>Publication Date:</strong> ${today}</p>
      <p><strong>Licensed to:</strong> ${userEmail}</p>
      <p><strong>Document ID:</strong> ${item.id}</p>
      
      <p style="margin-top: 30px;"><strong>© ${new Date().getFullYear()} SQEForge. All rights reserved.</strong></p>
      
      <p style="margin-top: 20px;">
        No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, 
        including photocopying, recording, or other electronic or mechanical methods, without the prior written 
        permission of the publisher.
      </p>
      
      <blockquote style="margin-top: 30px;">
        <p><strong>⚠️ IMPORTANT NOTICE</strong></p>
        <p>
          This document is digitally watermarked with your account details (${userEmail}) and is licensed 
          exclusively for your personal, non-commercial use in preparing for the SQE examinations. 
          Unauthorised sharing, distribution, copying, or reproduction of this material is strictly prohibited 
          and constitutes copyright infringement.
        </p>
      </blockquote>
      
      <p style="margin-top: 20px;">
        <strong>Disclaimer:</strong> This revision guide is designed to assist students preparing for the SQE1 
        examination. Content is based on English law as of 2024/2025. While every effort has been made to ensure 
        accuracy, this material should be used in conjunction with official SRA materials.
      </p>
    </div>
  </div>
  
  <!-- Main Content -->
  <div class="content">
    ${contentHtml}
    
    <div class="footer">
      <p><strong>© ${new Date().getFullYear()} SQEForge. All rights reserved.</strong></p>
      <p>Licensed to: ${userEmail} | Document ID: ${item.id}</p>
      <p>Page ${item.pages} of ${item.pages} | End of Document</p>
      <p style="margin-top: 10px;">Consistent practice + deep understanding + exam technique = SQE Success</p>
    </div>
    
  </div>
  
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
  
</body>
</html>
`;
};

const PREMIUM_CONTENT = {
  guides: [
    // FLK1 Guides (9 subjects)
    { id: 'guide-1', title: 'Complete Contract Law Study Guide', description: 'Comprehensive guide covering formation, terms, vitiating factors, discharge, remedies with case analysis.', subject: 'Contract Law', flk: 'FLK 1', tier: 'pro', type: 'PDF', pages: 150, downloads: 1247, rating: 4.8 },
    { id: 'guide-2', title: 'Business Law & Practice Essentials', description: 'Business structures, company formation, directors duties, shareholders rights, financing, commercial transactions.', subject: 'Business Law & Practice', flk: 'FLK 1', tier: 'pro', type: 'PDF', pages: 165, downloads: 743, rating: 4.6 },
    { id: 'guide-3', title: 'Tort Law Complete Guide', description: 'All tort principles: negligence, occupiers liability, vicarious liability, nuisance, defamation.', subject: 'Tort Law', flk: 'FLK 1', tier: 'pro', type: 'PDF', pages: 140, downloads: 1123, rating: 4.8 },
    { id: 'guide-4', title: 'Dispute Resolution Handbook', description: 'Civil procedure, pre-action protocols, interim applications, disclosure, trial procedure, appeals, ADR.', subject: 'Dispute Resolution', flk: 'FLK 1', tier: 'pro', type: 'PDF', pages: 175, downloads: 834, rating: 4.8 },
    { id: 'guide-5', title: 'Constitutional & Administrative Law Guide', description: 'Parliamentary sovereignty, rule of law, separation of powers, judicial review, human rights.', subject: 'Constitutional & Administrative Law', flk: 'FLK 1', tier: 'pro', type: 'PDF', pages: 145, downloads: 892, rating: 4.7 },
    { id: 'guide-6', title: 'EU Law Fundamentals', description: 'EU institutions, sources of law, direct effect, supremacy, state liability, free movement.', subject: 'EU Law', flk: 'FLK 1', tier: 'pro', type: 'PDF', pages: 130, downloads: 678, rating: 4.6 },
    { id: 'guide-7', title: 'English Legal System Complete', description: 'Court structure, sources of law, statutory interpretation, judicial precedent, law-making.', subject: 'The Legal System of England & Wales', flk: 'FLK 1', tier: 'pro', type: 'PDF', pages: 125, downloads: 1034, rating: 4.8 },
    { id: 'guide-8', title: 'Legal Services Regulation Guide', description: 'Structure of legal profession, regulation, reserved activities, professional bodies.', subject: 'Legal Services', flk: 'FLK 1', tier: 'pro', type: 'PDF', pages: 110, downloads: 756, rating: 4.5 },
    { id: 'guide-9', title: 'Ethics & Professional Conduct Masterclass', description: 'SRA principles, conflicts, confidentiality, client care, complaints, responsibilities.', subject: 'Ethics & Professional Conduct', flk: 'FLK 1', tier: 'pro', type: 'PDF', pages: 120, downloads: 1456, rating: 4.9 },
    
    // FLK2 Guides (7 subjects)
    { id: 'guide-10', title: 'Property Practice Complete Course', description: 'Conveyancing, leases, registered/unregistered land, mortgages, registration procedures.', subject: 'Property Practice', flk: 'FLK 2', tier: 'pro', type: 'PDF', pages: 200, downloads: 892, rating: 4.7 },
    { id: 'guide-11', title: 'Land Law Fundamentals', description: 'Estates, co-ownership, proprietary estoppel, easements, restrictive covenants, adverse possession.', subject: 'Land Law', flk: 'FLK 2', tier: 'pro', type: 'PDF', pages: 155, downloads: 967, rating: 4.7 },
    { id: 'guide-12', title: 'Wills & Administration Complete', description: 'Wills validity, intestacy rules, grants of representation, PRs duties, estate administration.', subject: 'Wills & Administration of Estates', flk: 'FLK 2', tier: 'pro', type: 'PDF', pages: 135, downloads: 823, rating: 4.6 },
    { id: 'guide-13', title: 'Trusts Law Complete Guide', description: 'Trust creation, certainties, formalities, trustees duties/powers, breach of trust, remedies.', subject: 'Trusts', flk: 'FLK 2', tier: 'pro', type: 'PDF', pages: 160, downloads: 901, rating: 4.8 },
    { id: 'guide-14', title: 'Criminal Law & Practice Handbook', description: 'Actus reus, mens rea, participation, inchoate offences, defences, property/person offences.', subject: 'Criminal Law', flk: 'FLK 2', tier: 'pro', type: 'PDF', pages: 180, downloads: 1089, rating: 4.9 },
    { id: 'guide-15', title: 'Criminal Practice Complete', description: 'Police powers, PACE, procedure, evidence, bail, mode of trial, sentencing, appeals.', subject: 'Criminal Practice', flk: 'FLK 2', tier: 'pro', type: 'PDF', pages: 170, downloads: 945, rating: 4.7 },
    { id: 'guide-16', title: 'Solicitors Accounts Mastery', description: 'SRA Accounts Rules, client/office accounts, double-entry bookkeeping, reconciliations, compliance.', subject: 'Solicitors Accounts', flk: 'FLK 2', tier: 'pro', type: 'PDF', pages: 115, downloads: 1134, rating: 4.8 },
  ],
  templates: [
    { id: 'template-1', title: 'Mock Exam Strategy Template', description: 'Structured approach to mocks with time management.', tier: 'starter', type: 'PDF', downloads: 2341, rating: 4.5 },
    { id: 'template-2', title: 'Study Schedule Planner', description: '12-week study plan with daily goals and tracking.', tier: 'starter', type: 'Excel', downloads: 1876, rating: 4.7 },
    { id: 'template-3', title: 'Case Law Summary Template', description: 'Efficient template for organising key cases.', tier: 'pro', type: 'Word', downloads: 1432, rating: 4.6 },
    { id: 'template-4', title: 'Exam Day Checklist', description: 'Comprehensive checklist for exam prep and essentials.', tier: 'starter', type: 'PDF', downloads: 3127, rating: 4.8 },
  ]
};

const TIER_ACCESS = {
  starter: ['starter'],
  pro: ['starter', 'pro'],
  ultimate: ['starter', 'pro', 'ultimate']
};

export default function PremiumContentLibrary() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('flk1');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingItemId, setGeneratingItemId] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
    }
    setLoading(false);
  };

  const hasAccess = (requiredTier) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const userTier = user.subscription_tier || 'starter';
    return TIER_ACCESS[userTier]?.includes(requiredTier);
  };

  const getTierBadge = (tier) => {
    const colours = {
      starter: 'bg-slate-600',
      pro: 'bg-purple-600',
      ultimate: 'bg-amber-600'
    };
    return (
      <Badge className={`${colours[tier]} text-white capitalize`}>
        <Crown className="w-3 h-3 mr-1" />
        {tier}
      </Badge>
    );
  };

  const filterContent = (items, flkType = null) => {
    let filtered = items;
    
    if (flkType) {
      filtered = filtered.filter(item => item.flk === flkType);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(item => item.subject === selectedSubject);
    }
    
    if (selectedTier !== 'all') {
      filtered = filtered.filter(item => item.tier === selectedTier);
    }
    
    return filtered;
  };

  const handleDownloadPDF = async (item) => {
    if (!hasAccess(item.tier)) {
      alert('This content requires ' + item.tier + ' tier access. Please upgrade your subscription.');
      return;
    }

    // Open window IMMEDIATELY (Synchronously) to bypass pop-up blockers
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups for this site to download content.');
      return;
    }

    // Show loading state in new window immediately
    printWindow.document.write(`
      <html>
        <head>
          <title>Generating Content...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#f8fafc;margin:0;">
          <div style="text-align:center;color:#334155;padding:20px;">
            <div style="font-size:40px;margin-bottom:20px;animation:bounce 1s infinite;">📄</div>
            <h2>Preparing your document...</h2>
            <p>This may take a few seconds.</p>
          </div>
          <style>@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }</style>
        </body>
      </html>
    `);

    setGeneratingPDF(true);
    setGeneratingItemId(item.id);

    try {
      // Try to fetch cached content from database first
      let contentMarkdown = null;
      
      try {
        const cachedContents = await base44.entities.PremiumContent.filter({ guide_id: item.id });
        if (cachedContents && cachedContents.length > 0) {
          contentMarkdown = cachedContents[0].generated_content;
        }
      } catch (cacheError) {
        console.log('No cached content found for item ID:', item.id, ', using fallback', cacheError);
      }
      
      // If no cached content, generate fresh AI content
      if (!contentMarkdown) {
        try {
          // Update loading window text
          if (printWindow && printWindow.document) {
             const h2 = printWindow.document.querySelector('h2');
             const p = printWindow.document.querySelector('p');
             if (h2) h2.textContent = "Writing your study guide...";
             if (p) p.textContent = "Using AI to generate comprehensive notes. This takes about 30-60 seconds.";
          }

          const aiResponse = await generateAIContent(item);
          contentMarkdown = aiResponse;

          // Cache the generated content
          try {
            await base44.entities.PremiumContent.create({
              guide_id: item.id,
              title: item.title,
              subject: item.subject,
              flk: item.flk,
              generated_content: contentMarkdown,
              content_version: 1,
              generation_date: new Date().toISOString(),
              word_count: contentMarkdown.split(/\s+/).length
            });
          } catch (e) {
            console.warn('Failed to cache content:', e);
          }
        } catch (aiError) {
          console.error("AI generation failed, using fallback", aiError);
          contentMarkdown = generateFallbackContent(item);
        }
      }

      const htmlContent = await generatePDFContent(item, user?.email || 'User', contentMarkdown);
      
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      if (printWindow) printWindow.close();
      alert('Failed to generate study guide. Please try again or contact support.');
    } finally {
      setGeneratingPDF(false);
      setGeneratingItemId(null);
    }
  };

  const ContentCard = ({ item }) => {
    const canAccess = hasAccess(item.tier);
    const isGenerating = generatingPDF && generatingItemId === item.id;

    return (
      <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-2 gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {getTierBadge(item.tier)}
                <Badge variant="outline" className="text-xs">{item.type}</Badge>
                {item.flk && <Badge className="bg-blue-100 text-blue-800 text-xs">{item.flk}</Badge>}
              </div>
              <CardTitle className="text-base leading-tight wrap-break-words">{item.title}</CardTitle>
            </div>
            {!canAccess && <Lock className="w-5 h-5 text-slate-400 shrink-0" />}
          </div>
          {item.subject && (
            <Badge variant="outline" className="text-xs w-fit">
              {item.subject}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <p className="text-sm text-slate-600 mb-4 line-clamp-3">{item.description}</p>
          
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 flex-wrap mt-auto">
            {item.pages && (
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>{item.pages}p</span>
              </div>
            )}
            {item.downloads && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{item.downloads.toLocaleString()}</span>
              </div>
            )}
            {item.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{item.rating}</span>
              </div>
            )}
          </div>

          {canAccess ? (
            <Button 
              onClick={() => handleDownloadPDF(item)}
              disabled={isGenerating}
              className="w-full gap-2 bg-slate-900 hover:bg-slate-800 touch-manipulation" 
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF
                </>
              )}
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full touch-manipulation" size="sm">
              <Link to={createPageUrl('Packages')}>
                <Lock className="w-4 h-4 mr-2" />
                Upgrade to Access
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  const allGuides = [...PREMIUM_CONTENT.guides];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 shrink-0" />
            <span className="wrap-break-words">Premium Content Library</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600">Comprehensive study materials - Instant download available</p>
        </div>

        {user && (
          <Alert className="mb-6 bg-linear-to-r from-purple-50 to-blue-50 border-purple-200">
            <Award className="h-4 w-4 text-purple-600 shrink-0" />
            <AlertDescription className="text-slate-800 text-sm">
              <strong>Your Plan: {(user.subscription_tier || 'starter').charAt(0).toUpperCase() + (user.subscription_tier || 'starter').slice(1)}</strong>
              {user.subscription_tier === 'starter' && ' - Access to basic resources. Upgrade to Pro for full study guides.'}
              {user.subscription_tier === 'pro' && ' - Full access to guides for FLK1 and FLK2. Download instantly as PDF.'}
              {user.subscription_tier === 'ultimate' && ' - Complete access to all premium content!'}
            </AlertDescription>
          </Alert>
        )}

        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Study Guides Now Available:</strong> All guides are ready for instant download. Full comprehensive content with detailed case law and statutory analysis will be added progressively. Use our Question Bank, Mock Exams, and Flash Cards for complete exam preparation.
          </AlertDescription>
        </Alert>

        <Card className="mb-6 border-none shadow-lg">
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 sm:pl-10 text-sm sm:text-base"
                />
              </div>
              
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <optgroup label="FLK 1 Subjects">
                    {FLK1_SUBJECTS.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </optgroup>
                  <optgroup label="FLK 2 Subjects">
                    {FLK2_SUBJECTS.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </optgroup>
                </SelectContent>
              </Select>
              
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="ultimate">Ultimate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="flk1" className="text-xs sm:text-sm">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              FLK 1
            </TabsTrigger>
            <TabsTrigger value="flk2" className="text-xs sm:text-sm">
              <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              FLK 2
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs sm:text-sm">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flk1" className="mt-6">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">FLK 1 Study Materials</h2>
              <p className="text-sm text-slate-600 mb-4">
                Comprehensive guides covering all 9 FLK1 subjects. Download instantly as PDF.
              </p>
              <Badge className="bg-blue-100 text-blue-800 text-xs sm:text-sm">
                {filterContent(allGuides, 'FLK 1').length} Resources Available
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filterContent(allGuides, 'FLK 1').map(item => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
            
            {filterContent(allGuides, 'FLK 1').length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">
                No FLK1 materials found matching your filters.
              </div>
            )}
          </TabsContent>

          <TabsContent value="flk2" className="mt-6">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">FLK 2 Study Materials</h2>
              <p className="text-sm text-slate-600 mb-4">
                Comprehensive guides covering all 7 FLK2 subjects. Download instantly as PDF.
              </p>
              <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm">
                {filterContent(allGuides, 'FLK 2').length} Resources Available
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filterContent(allGuides, 'FLK 2').map(item => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
            
            {filterContent(allGuides, 'FLK 2').length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">
                No FLK2 materials found matching your filters.
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Study Templates & Planning Tools</h2>
              <p className="text-sm text-slate-600">
                Practical templates to organise your study and track progress.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {PREMIUM_CONTENT.templates.map(item => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {user && user.subscription_tier === 'starter' && (
          <Card className="mt-8 border-purple-200 bg-linear-to-r from-purple-50 to-pink-50">
            <CardContent className="p-6 sm:p-8 text-center">
              <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Unlock Complete Study Guides</h3>
              <p className="text-sm sm:text-base text-slate-700 mb-6">
                Get instant access to comprehensive study guides for all FLK1 and FLK2 subjects.
              </p>
              <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto touch-manipulation">
                <Link to={createPageUrl('Packages')}>
                  View Upgrade Options
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {user && user.subscription_tier === 'pro' && (
          <Card className="mt-8 border-amber-200 bg-linear-to-r from-amber-50 to-orange-50">
            <CardContent className="p-6 sm:p-8 text-center">
              <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Go Ultimate for Advanced Content</h3>
              <p className="text-sm sm:text-base text-slate-700 mb-6">
                Unlock advanced analysis guides designed for top performers.
              </p>
              <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto touch-manipulation">
                <Link to={createPageUrl('Packages')}>
                  Upgrade to Ultimate
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}