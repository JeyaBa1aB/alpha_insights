"""
AI Service for Alpha Insights - Fixed Version
Integrates with Gemini-1.5-Flash and implements multi-agent framework with MongoDB persistence
"""

import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import hashlib
from pymongo import MongoClient
from bson import ObjectId

# Import AI libraries
try:
    import google.generativeai as genai
except ImportError:
    genai = None

logger = logging.getLogger(__name__)

class AIAgent:
    """Enhanced AI agent with MongoDB persistence and memory"""
    
    def __init__(self, name: str, role: str, system_prompt: str, db=None):
        self.name = name
        self.role = role
        self.system_prompt = system_prompt
        self.agent_id = self._generate_agent_id()
        self.db = db
        self.conversation_history = []
        self.long_term_memory = {}
        self.personality_traits = self._define_personality()
        
        # Load existing memory from MongoDB
        if self.db is not None:
            self._load_agent_memory()
    
    def _generate_agent_id(self) -> str:
        """Generate unique agent ID"""
        return hashlib.md5(f"{self.name}_{self.role}".encode()).hexdigest()[:8]
    
    def _define_personality(self) -> Dict[str, Any]:
        """Define agent personality traits"""
        base_traits = {
            'communication_style': 'professional',
            'expertise_confidence': 0.8,
            'helpfulness': 0.9,
            'patience': 0.8
        }
        
        # Customize based on agent type
        if 'Portfolio' in self.name:
            base_traits.update({
                'risk_tolerance': 'moderate',
                'analytical_depth': 'high',
                'market_outlook': 'balanced'
            })
        elif 'Research' in self.name:
            base_traits.update({
                'analysis_style': 'thorough',
                'data_focus': 'high',
                'prediction_confidence': 'moderate'
            })
        elif 'Education' in self.name:
            base_traits.update({
                'teaching_style': 'patient',
                'explanation_detail': 'comprehensive',
                'encouragement_level': 'high'
            })
        
        return base_traits
    
    def _load_agent_memory(self):
        """Load agent memory from MongoDB"""
        try:
            if self.db is None:
                return
            
            # Load conversation history
            conversations = self.db.agent_conversations.find({
                'agent_id': self.agent_id
            }).sort('timestamp', -1).limit(50)
            
            self.conversation_history = []
            for conv in conversations:
                self.conversation_history.append({
                    'timestamp': conv['timestamp'],
                    'user_message': conv['user_message'],
                    'agent_response': conv['agent_response'],
                    'agent_name': self.name,
                    'context': conv.get('context', {}),
                    'confidence': conv.get('confidence', 0.5)
                })
            
            # Reverse to get chronological order
            self.conversation_history.reverse()
            
            # Load long-term memory
            memory_doc = self.db.agent_memory.find_one({'agent_id': self.agent_id})
            if memory_doc:
                self.long_term_memory = memory_doc.get('memory', {})
                self.personality_traits.update(memory_doc.get('personality_traits', {}))
                
        except Exception as e:
            logger.error(f"Failed to load agent memory for {self.name}: {e}")
    
    def add_to_history(self, user_message: str, agent_response: str, user_id: str = None, context: Dict = None, confidence: float = 0.8):
        """Add conversation to history with MongoDB persistence"""
        conversation_entry = {
            'timestamp': datetime.now().isoformat(),
            'user_message': user_message,
            'agent_response': agent_response,
            'agent_name': self.name,
            'context': context or {},
            'confidence': confidence
        }
        
        # Add to memory
        self.conversation_history.append(conversation_entry)
        
        # Persist to MongoDB
        if self.db is not None:
            try:
                doc = {
                    'agent_id': self.agent_id,
                    'agent_name': self.name,
                    'user_id': user_id,
                    'timestamp': datetime.now(),
                    'user_message': user_message,
                    'agent_response': agent_response,
                    'context': context or {},
                    'confidence': confidence
                }
                self.db.agent_conversations.insert_one(doc)
                
            except Exception as e:
                logger.error(f"Failed to persist conversation for {self.name}: {e}")
    
    def get_context(self, user_id: str = None) -> str:
        """Get personalized conversation context for the agent"""
        context = f"You are {self.name}, {self.role}.\n{self.system_prompt}\n\n"
        
        # Add personality traits
        context += f"Your personality traits: {json.dumps(self.personality_traits, indent=2)}\n\n"
        
        # Add recent conversation history
        if self.conversation_history:
            context += "Recent conversation history:\n"
            for entry in self.conversation_history[-3:]:  # Last 3 exchanges
                context += f"User: {entry['user_message']}\n"
                context += f"{self.name}: {entry['agent_response']}\n\n"
        
        return context

class AIService:
    """Enhanced AI service with multi-agent support and MongoDB persistence"""
    
    def __init__(self):
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        self.model = None
        self.db = None
        
        # Initialize MongoDB connection
        self._initialize_database()
        
        # Initialize Gemini
        if self.gemini_api_key and genai:
            try:
                genai.configure(api_key=self.gemini_api_key)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                logger.info("Gemini-1.5-Flash initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")
                self.model = None
        else:
            if not self.gemini_api_key:
                logger.error("GEMINI_API_KEY not found in environment variables")
            if not genai:
                logger.error("google.generativeai module not available")
            self.model = None
        
        # Initialize agents with database connection
        self.agents = self._initialize_agents()
        self.master_agent = self._initialize_master_agent()
    
    def _initialize_database(self):
        """Initialize MongoDB connection for agent memory"""
        try:
            mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/alpha_insights')
            client = MongoClient(mongo_uri)
            self.db = client.get_database()
            
            # Test connection
            client.admin.command('ping')
            logger.info("MongoDB connection established for AI service")
            
            # Create indexes for better performance
            self.db.agent_conversations.create_index([('agent_id', 1), ('timestamp', -1)])
            self.db.agent_memory.create_index([('agent_id', 1)])
            
        except Exception as e:
            logger.warning(f"MongoDB connection failed for AI service: {e}")
            self.db = None
    
    def _initialize_agents(self) -> Dict[str, AIAgent]:
        """Initialize specialized AI agents with database connection"""
        agents = {}
        
        # Portfolio Agent
        agents['portfolio'] = AIAgent(
            name="Portfolio Agent",
            role="Portfolio Management Specialist",
            system_prompt="""You are a portfolio management specialist. Provide concise, actionable advice on:
            - Portfolio optimization strategies
            - Asset allocation recommendations  
            - Risk management techniques
            - Diversification strategies
            - Performance analysis
            
            Be direct and professional. Use bullet points for strategies. Focus on actionable advice.""",
            db=self.db
        )
        
        # Research Agent
        agents['research'] = AIAgent(
            name="Research Agent", 
            role="Stock Research Analyst",
            system_prompt="""You are a stock research analyst. Provide concise, data-driven analysis on:
            - Stock fundamental analysis (P/E, ROE, debt ratios)
            - Company financial health
            - Market trends and sector performance
            - Valuation and price targets
            - Investment recommendations
            
            Be professional and direct. Include specific metrics and data. Avoid conversational filler.""",
            db=self.db
        )
        
        # Support Agent
        agents['support'] = AIAgent(
            name="Support Agent",
            role="Customer Support Specialist", 
            system_prompt="""You are a customer support specialist. Provide clear, step-by-step guidance on:
            - Platform navigation and features
            - Technical troubleshooting
            - Account settings and customization
            - Tool usage instructions
            
            Be direct and procedural. Use numbered steps. Avoid pleasantries.""",
            db=self.db
        )
        
        # Education Agent
        agents['education'] = AIAgent(
            name="Education Agent",
            role="Financial Education Specialist",
            system_prompt="""You are a financial educator. Provide clear, textbook-style explanations of:
            - Financial concepts and terminology
            - Investment principles and strategies
            - Market mechanics and analysis methods
            - Risk management concepts
            
            Be professional and educational. Include definitions and formulas. Avoid overly simple analogies.""",
            db=self.db
        )
        
        return agents
    
    def _initialize_master_agent(self) -> AIAgent:
        """Initialize master routing agent"""
        return AIAgent(
            name="Master Agent",
            role="Query Router",
            system_prompt="""You route queries to appropriate specialist agents. Respond in JSON format:
            {
                "agent": "agent_name" or ["agent1", "agent2"] for multi-agent,
                "confidence": 0.0-1.0,
                "reasoning": "explanation",
                "response": null,
                "context_hints": ["relevant", "context"],
                "followup_suggestions": ["potential", "questions"]
            }
            
            Available agents:
            - portfolio: Portfolio management, asset allocation, optimization
            - research: Stock analysis, company research, market analysis  
            - support: Platform help, technical support, how-to questions
            - education: Learning concepts, explanations, definitions
            
            For complex queries needing multiple perspectives, use array format.""",
            db=self.db
        )
    
    def _generate_response(self, prompt: str) -> Optional[str]:
        """Generate response using Gemini"""
        if not self.model:
            return "AI service is not available. Please check API configuration."
        
        try:
            response = self.model.generate_content(prompt)
            return response.text if response else None
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return f"I'm experiencing technical difficulties. Please try again later."
    
    def route_query(self, user_message: str, user_context: Dict = None) -> Dict[str, Any]:
        """Enhanced query routing with context-aware agent handoff"""
        try:
            user_id = user_context.get('user_id') if user_context else None
            
            # Build routing context
            context = self.master_agent.get_context(user_id)
            context += f"\nCurrent user query: {user_message}\n"
            context += "\nDetermine the best agent(s) and respond in JSON format."
            
            # Get routing decision
            routing_response = self._generate_response(context)
            
            if not routing_response:
                return self._fallback_response("Failed to process your request")
            
            return self._process_routing_decision(routing_response, user_message, user_context)
                
        except Exception as e:
            logger.error(f"Query routing error: {e}")
            return self._fallback_response("I'm experiencing technical difficulties")
    
    def _process_routing_decision(self, routing_response: str, user_message: str, user_context: Dict) -> Dict[str, Any]:
        """Process and validate routing decision"""
        try:
            # Try to parse JSON response
            try:
                routing_data = json.loads(routing_response)
            except json.JSONDecodeError:
                # If JSON parsing fails, extract agent name from text
                routing_data = self._extract_routing_from_text(routing_response)
            
            agent_name = routing_data.get('agent', 'master')
            
            # Handle multi-agent responses (when agent is a list)
            if isinstance(agent_name, list):
                return self._handle_multi_agent_query(user_message, user_context, agent_name)
            
            # Handle master agent direct response
            if agent_name == 'master' or routing_data.get('response'):
                return {
                    'agent': 'master',
                    'agent_name': 'Master Agent',
                    'response': routing_data.get('response', routing_response),
                    'confidence': routing_data.get('confidence', 0.8),
                    'reasoning': routing_data.get('reasoning', 'Direct response from master agent')
                }
            
            # Route to specialist agent
            if agent_name in self.agents:
                return self._get_agent_response(agent_name, user_message, user_context)
            else:
                return self._fallback_response(f"Unknown agent: {agent_name}")
                
        except Exception as e:
            logger.error(f"Routing decision processing error: {e}")
            return self._fallback_response("Failed to process routing decision")
    
    def _handle_multi_agent_query(self, user_message: str, user_context: Dict, required_agents: List[str]) -> Dict[str, Any]:
        """Handle queries requiring multiple agents"""
        try:
            responses = {}
            combined_response = ""
            overall_confidence = 0.0
            
            # Get response from each required agent
            for agent_name in required_agents:
                if agent_name in self.agents:
                    agent_response = self._get_agent_response(agent_name, user_message, user_context)
                    responses[agent_name] = agent_response
                    overall_confidence += agent_response.get('confidence', 0.5)
            
            # Calculate average confidence
            overall_confidence = overall_confidence / len(required_agents) if required_agents else 0.5
            
            # Synthesize responses
            if len(responses) > 1:
                combined_response = "Here's a comprehensive response from multiple specialists:\n\n"
                
                for i, (agent_name, response) in enumerate(responses.items(), 1):
                    agent_display_name = response.get('agent_name', agent_name.title())
                    combined_response += f"**{agent_display_name}:**\n"
                    combined_response += f"{response.get('response', '')}\n\n"
                
            elif len(responses) == 1:
                # Single agent fallback
                single_response = list(responses.values())[0]
                combined_response = single_response.get('response', '')
            
            return {
                'agent': 'multi-agent',
                'agent_name': 'Coordinated Response',
                'response': combined_response,
                'confidence': overall_confidence,
                'reasoning': f'Multi-agent coordination: {", ".join(required_agents)}',
                'participating_agents': list(responses.keys())
            }
            
        except Exception as e:
            logger.error(f"Multi-agent handling error: {e}")
            return self._fallback_response("Failed to coordinate multi-agent response")
    
    def _extract_routing_from_text(self, text: str) -> Dict[str, Any]:
        """Extract routing information from non-JSON text"""
        text_lower = text.lower()
        
        # Simple keyword-based routing fallback
        if any(word in text_lower for word in ['portfolio', 'allocation', 'diversification']):
            return {'agent': 'portfolio', 'confidence': 0.7}
        elif any(word in text_lower for word in ['stock', 'analysis', 'research', 'company']):
            return {'agent': 'research', 'confidence': 0.7}
        elif any(word in text_lower for word in ['learn', 'explain', 'education', 'what is']):
            return {'agent': 'education', 'confidence': 0.7}
        elif any(word in text_lower for word in ['help', 'how to', 'support', 'navigate']):
            return {'agent': 'support', 'confidence': 0.7}
        else:
            return {'agent': 'master', 'response': text, 'confidence': 0.5}
    
    def _get_agent_response(self, agent_name: str, user_message: str, user_context: Dict = None) -> Dict[str, Any]:
        """Get response from specific agent"""
        try:
            if agent_name not in self.agents:
                return self._fallback_response(f"Agent {agent_name} not found")
            
            agent = self.agents[agent_name]
            user_id = user_context.get('user_id') if user_context else None
            
            # Build agent context
            context = agent.get_context(user_id)
            context += f"\nUser query: {user_message}\n"
            
            # Add specific instructions based on agent type
            if agent_name == 'research':
                context += "\nProvide a concise, data-driven analysis focusing on key financial metrics. Be professional and direct."
            elif agent_name == 'portfolio':
                context += "\nProvide actionable portfolio strategies in bullet points. Be specific and professional."
            elif agent_name == 'education':
                context += "\nProvide a clear, textbook-style explanation with definitions and formulas where applicable."
            elif agent_name == 'support':
                context += "\nProvide step-by-step instructions. Be direct and procedural."
            
            context += "\nRespond professionally and concisely."
            
            # Generate response
            response = self._generate_response(context)
            
            if not response:
                return self._fallback_response("Failed to generate response")
            
            # Store conversation in agent memory
            agent.add_to_history(user_message, response, user_id, user_context, 0.8)
            
            return {
                'agent': agent_name,
                'agent_name': agent.name,
                'response': response,
                'confidence': 0.8,
                'reasoning': f'Response generated by {agent.name}'
            }
            
        except Exception as e:
            logger.error(f"Agent response error for {agent_name}: {e}")
            return self._fallback_response(f"Error generating response from {agent_name}")
    
    def _fallback_response(self, error_message: str) -> Dict[str, Any]:
        """Generate fallback response for errors"""
        return {
            'agent': 'master',
            'agent_name': 'Master Agent',
            'response': "I apologize, but I'm experiencing technical difficulties. Please try rephrasing your question or contact support if the issue persists.",
            'confidence': 0.3,
            'reasoning': f'Fallback response due to: {error_message}'
        }

    # Utility methods for conversation management
    def get_conversation_history(self, agent_name: str = None) -> List[Dict[str, Any]]:
        """Get conversation history for specific agent or all agents"""
        try:
            if self.db is None:
                return []
            
            query = {}
            if agent_name and agent_name in self.agents:
                agent = self.agents[agent_name]
                query['agent_id'] = agent.agent_id
            
            conversations = self.db.agent_conversations.find(query).sort('timestamp', -1).limit(100)
            
            history = []
            for conv in conversations:
                history.append({
                    'timestamp': conv['timestamp'].isoformat() if hasattr(conv['timestamp'], 'isoformat') else conv['timestamp'],
                    'agent_name': conv['agent_name'],
                    'user_message': conv['user_message'],
                    'agent_response': conv['agent_response'],
                    'confidence': conv.get('confidence', 0.5)
                })
            
            return history
            
        except Exception as e:
            logger.error(f"Failed to get conversation history: {e}")
            return []
    
    def clear_conversation_history(self, agent_name: str = None):
        """Clear conversation history for specific agent or all agents"""
        try:
            if self.db is None:
                return
            
            if agent_name and agent_name in self.agents:
                agent = self.agents[agent_name]
                self.db.agent_conversations.delete_many({'agent_id': agent.agent_id})
                agent.conversation_history = []
            else:
                self.db.agent_conversations.delete_many({})
                for agent in self.agents.values():
                    agent.conversation_history = []
                    
        except Exception as e:
            logger.error(f"Failed to clear conversation history: {e}")

# Global AI service instance
ai_service = AIService()