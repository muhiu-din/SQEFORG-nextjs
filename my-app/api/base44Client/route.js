// Mock base44 client for frontend-only application
export const base44 = {
  entities: {
    Question: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()}),
      update: (id, data) => Promise.resolve({...data, id}),
      bulkCreate: (data) => Promise.resolve(data.map((item, index) => ({...item, id: index})))
    },
    MockExam: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()}),
      update: (id, data) => Promise.resolve({...data, id})
    },
    ExamAttempt: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()}),
      update: (id, data) => Promise.resolve({...data, id})
    },
    UserAnswerLog: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()}),
      update: (id, data) => Promise.resolve({...data, id})
    },
    StudyNote: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()}),
      update: (id, data) => Promise.resolve({...data, id})
    },
    StudyLog: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()}),
      update: (id, data) => Promise.resolve({...data, id})
    },
    UploadedFile: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    Post: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    DailyChallengeCompletion: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    Review: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    AICreditLog: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    ManualMock: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    RevisionBook: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    StudyGroup: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    FlashCard: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()}),
      bulkCreate: (data) => Promise.resolve(data.map((item, index) => ({...item, id: index})))
    },
    FlashCardReview: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    BlackLetterQuestion: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    FlashCardDeck: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    ForumAnswer: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    PremiumContent: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    PracticeQuestion: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    UserQuizResult: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    SpacedRepetition: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    QuestionReview: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    MentalPrepProgress: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    MentalHealthFlag: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()}),
      update: (id, data) => Promise.resolve({...data, id})
    },
    PracticeSession: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    FlaggedQuestion: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()})
    },
    BulkGenerationProgress: {
      list: () => Promise.resolve([]),
      filter: () => Promise.resolve([]),
      create: (data) => Promise.resolve({...data, id: Date.now()}),
      update: (id, data) => Promise.resolve({...data, id})
    }
  },
  integrations: {
    Core: {
      InvokeLLM: (params) => Promise.resolve({ result: "Mock LLM response" }),
      SendEmail: (params) => Promise.resolve({ success: true }),
      UploadFile: (params) => Promise.resolve({ file_url: "mock-file-url" }),
      GenerateImage: (params) => Promise.resolve({ image_url: "mock-image-url" }),
      ExtractDataFromUploadedFile: (params) => Promise.resolve({ extracted_data: "mock-data" }),
      CreateFileSignedUrl: (params) => Promise.resolve({ signed_url: "mock-signed-url" }),
      UploadPrivateFile: (params) => Promise.resolve({ file_url: "mock-private-file-url" })
    }
  },
  auth: {
    me: () => Promise.resolve({ 
      email: import.meta.env.VITE_ADMIN_EMAIL || "user@example.com", 
      id: parseInt(import.meta.env.VITE_ADMIN_ID || "1"), 
      name: import.meta.env.VITE_ADMIN_NAME || "Mock User",
      role: "admin",
      subscription_tier: "ultimate",
      mock_exam_credits: 999,
      ai_credits: 999,
      terms_accepted: true
    }),
    isAuthenticated: () => Promise.resolve(true),
    redirectToLogin: (path) => console.log(`Redirecting to login from ${path}`),
    updateMe: (data) => Promise.resolve({ ...data }),
    login: async (email, password) => {
      if (email === import.meta.env.VITE_ADMIN_EMAIL && password === import.meta.env.VITE_ADMIN_PASSWORD) {
        return Promise.resolve({ 
          email: import.meta.env.VITE_ADMIN_EMAIL,
          id: parseInt(import.meta.env.VITE_ADMIN_ID),
          name: import.meta.env.VITE_ADMIN_NAME,
          role: "admin",
          subscription_tier: "ultimate"
        });
      }
      return Promise.reject(new Error("Invalid credentials"));
    }
  }
};