import { Request, Response } from "express";
import { storage } from "./storage";

// In a real implementation, this would use OpenAI or another LLM service
// For this example, we'll create a simplistic AI tutor that responds to basic queries
export async function handleTutorMessage(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = req.user!.id;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Get or create conversation
    let conversation = await storage.getAiTutorConversation(userId);
    
    if (!conversation) {
      conversation = await storage.createAiTutorConversation({
        userId,
        messages: [
          { role: "system", content: "You are a helpful AI tutor for the Abu Dhabi Visitor Experience Academy. Your goal is to help frontline staff learn about Abu Dhabi's culture, attractions, and customer service best practices." },
          { role: "assistant", content: `Hello! I'm your VX Academy AI assistant. I can help you with questions about your courses, Abu Dhabi knowledge, or visitor interaction scenarios. How can I assist you today?` }
        ]
      });
    }

    // Add user message
    const messages = [...conversation.messages, { role: "user", content: message }];
    
    // Generate a response
    // In a real implementation, this would call an LLM API like OpenAI
    const response = generateTutorResponse(message);
    
    // Add assistant response
    messages.push({ role: "assistant", content: response });
    
    // Update conversation
    const updatedConversation = await storage.updateAiTutorConversation(conversation.id, messages);
    
    res.json({ 
      message: response,
      conversation: updatedConversation 
    });
  } catch (error) {
    console.error("AI tutor error:", error);
    res.status(500).json({ message: "An error occurred with the AI tutor" });
  }
}

// Simple response generator based on keywords
// In a real implementation, this would use an actual LLM API
function generateTutorResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("culture") || lowerMessage.includes("heritage") || lowerMessage.includes("tradition")) {
    return "Abu Dhabi has a rich cultural heritage deeply rooted in Bedouin traditions. The emirate's culture emphasizes hospitality, respect, and community bonds. Key cultural elements include traditional music like Al-Ayyala, cuisine featuring dates and seafood, and practices like falconry. I recommend checking out the 'Cultural Heritage of Abu Dhabi' course for more in-depth information!";
  }
  
  if (lowerMessage.includes("attraction") || lowerMessage.includes("visit") || lowerMessage.includes("tourist")) {
    return "Abu Dhabi offers world-class attractions including the Sheikh Zayed Grand Mosque, Louvre Abu Dhabi, and Qasr Al Watan. For adventure, visitors enjoy Yas Island with Ferrari World and Warner Bros. World. Nature lovers appreciate the Mangrove National Park and the Empty Quarter desert. The 'Top Attractions of Abu Dhabi' module covers all major sites with visitor information!";
  }
  
  if (lowerMessage.includes("difficult") || lowerMessage.includes("angry") || lowerMessage.includes("upset")) {
    return "When dealing with upset visitors, remember to stay calm and listen actively. Acknowledge their concerns without interrupting, show empathy, and focus on solutions rather than dwelling on problems. Always maintain professionalism even if the visitor is emotional. The 'De-Escalation Tactics' course offers excellent role-play scenarios and practical techniques for these situations.";
  }
  
  if (lowerMessage.includes("language") || lowerMessage.includes("communicate") || lowerMessage.includes("foreign")) {
    return "Effective cross-cultural communication is key to visitor satisfaction. Basic phrases in Arabic, Hindi, Urdu, and Chinese can make a huge difference. Remember to speak clearly, avoid idioms, and use visual aids when needed. Body language varies across cultures, so be mindful of gestures. The 'Multilingual Communication' course offers practical phrases and cultural insights!";
  }
  
  if (lowerMessage.includes("thank") || lowerMessage.includes("help")) {
    return "You're welcome! I'm happy to help with your training journey. If you have more questions about any specific course material or visitor scenarios, feel free to ask anytime!";
  }
  
  // Default response
  return "That's a great question! The VX Academy has several courses that might address this topic. Could you provide more details about what you'd like to learn? I'm here to help guide your professional development as an Abu Dhabi frontliner.";
}
