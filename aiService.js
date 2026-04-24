/**
 * AI Service - Groq API Integration
 * This service handles AI chat functionality for the restaurant menu
 */

const groqService = require('./groqService');

// Get AI response for menu chat
async function getMenuChatResponse(userMessage, conversationHistory = []) {
  try {
    return await groqService.getChatResponse(userMessage, conversationHistory);
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
}

// Get AI response with menu context
async function getMenuContextualResponse(userMessage, menuItems, conversationHistory = []) {
  try {
    return await groqService.getMenuContextualResponse(userMessage, menuItems, conversationHistory);
  } catch (error) {
    console.error('AI Menu Contextual Service Error:', error);
    throw error;
  }
}

// Get admin analytics insight from AI
async function getAnalyticsInsight(analyticsData) {
  try {
    return await groqService.getAnalyticsInsight(analyticsData);
  } catch (error) {
    console.error('AI Analytics Insight Error:', error);
    throw error;
  }
}

// Get admin chat response with full context
async function getAdminChatResponse(userMessage, context, conversationHistory = []) {
  try {
    return await groqService.getAdminChatResponse(userMessage, context, conversationHistory);
  } catch (error) {
    console.error('AI Admin Chat Error:', error);
    throw error;
  }
}

// Get smart menu chat response with real order analytics - CUSTOMER VERSION
async function getSmartMenuChatResponse(userMessage, orderAnalytics, menuItems, conversationHistory = []) {
  try {
    return await groqService.getSmartMenuResponse(userMessage, orderAnalytics, menuItems, conversationHistory);
  } catch (error) {
    console.error('AI Smart Menu Chat Error:', error);
    throw error;
  }
}

module.exports = {
  getMenuChatResponse,
  getMenuContextualResponse,
  getAnalyticsInsight,
  getAdminChatResponse,
  getSmartMenuChatResponse
};
