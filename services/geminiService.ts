
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

// Declaração das funções que a IA pode chamar
const tools: FunctionDeclaration[] = [
  {
    name: "cadastrar_cliente",
    parameters: {
      type: Type.OBJECT,
      description: "Cadastra um novo cliente/parceiro no sistema.",
      properties: {
        company: { type: Type.STRING, description: "Nome da empresa ou razão social." },
        name: { type: Type.STRING, description: "Nome do responsável (Key Account)." },
        email: { type: Type.STRING, description: "E-mail de contato." },
        phone: { type: Type.STRING, description: "Telefone ou WhatsApp." },
        billingType: { type: Type.STRING, description: "Tipo de cobrança: 'monthly' para recorrente ou 'one_time' para único.", enum: ["monthly", "one_time"] }
      },
      required: ["company", "name", "email", "phone", "billingType"]
    }
  },
  {
    name: "abrir_projeto",
    parameters: {
      type: Type.OBJECT,
      description: "Cria um novo projeto de marketing e vincula ao financeiro.",
      properties: {
        name: { type: Type.STRING, description: "Nome do projeto ou campanha." },
        clientName: { type: Type.STRING, description: "Nome da empresa cliente já cadastrada." },
        budget: { type: Type.NUMBER, description: "Valor total do projeto." },
        serviceType: { type: Type.STRING, description: "Tipo de serviço (ex: Social Media, Google Ads, SEO)." },
        dueDate: { type: Type.STRING, description: "Data de entrega no formato YYYY-MM-DD." }
      },
      required: ["name", "clientName", "budget", "serviceType", "dueDate"]
    }
  },
  {
    name: "registrar_financeiro",
    parameters: {
      type: Type.OBJECT,
      description: "Registra uma entrada ou saída financeira manual.",
      properties: {
        description: { type: Type.STRING, description: "Descrição da transação." },
        amount: { type: Type.NUMBER, description: "Valor em Reais." },
        type: { type: Type.STRING, description: "Tipo: 'income' (entrada) ou 'expense' (saída).", enum: ["income", "expense"] }
      },
      required: ["description", "amount", "type"]
    }
  }
];

// Fix: Utilizando histórico e chamada direta ao generateContent seguindo diretrizes do SDK
export const chatWithAssistant = async (message: string, history: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // Mescla o histórico anterior com a nova mensagem do usuário
    const contents = [
      ...history,
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: `Você é o Cérebro da Luminus Marketing. Você tem poder para gerenciar a agência. 
        Sempre que o usuário descrever um novo negócio, use as ferramentas para cadastrar cliente, abrir projeto e registrar o financeiro simultaneamente.
        Seja proativo: se um projeto é de R$ 5000, registre essa entrada no financeiro automaticamente chamando a função.
        Responda em Português de forma executiva e direta.`,
        tools: [{ functionDeclarations: tools }]
      }
    });

    return response;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
