"""
AI Service for Alpha Insights
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

# Import AutoGen (stub for now, will be enhanced)
try:
    import autogen
except ImportError:
    autogen = None

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
                
                # Update long-term memory patterns
                self._update_long_term_memory(user_message, agent_response, context)
                
            except Exception as e:
                logger.error(f"Failed to persist conversation for {self.name}: {e}")
    
    def _update_long_term_memory(self, user_message: str, agent_response: str, context: Dict = None):
        """Update long-term memory patterns"""
        try:
            # Extract key topics and patterns
            topics = self._extract_topics(user_message)
            
            # Update memory patterns
            for topic in topics:
                if topic not in self.long_term_memory:
                    self.long_term_memory[topic] = {
                        'frequency': 1,
                        'last_discussed': datetime.now().isoformat(),
                        'user_expertise_level': 'beginner',
                        'common_questions': []
                    }
                else:
                    self.long_term_memory[topic]['frequency'] += 1
                    self.long_term_memory[topic]['last_discussed'] = datetime.now().isoformat()
                
                # Add to common questions
                if len(self.long_term_memory[topic]['common_questions']) < 10:
                    self.long_term_memory[topic]['common_questions'].append(user_message[:100])
            
            # Persist to MongoDB
            if self.db is not None:
                self.db.agent_memory.update_one(
                    {'agent_id': self.agent_id},
                    {
                        '$set': {
                            'agent_name': self.name,
                            'memory': self.long_term_memory,
                            'personality_traits': self.personality_traits,
                            'last_updated': datetime.now()
                        }
                    },
                    upsert=True
                )
                
        except Exception as e:
            logger.error(f"Failed to update long-term memory for {self.name}: {e}")
    
    def _extract_topics(self, message: str) -> List[str]:
        """Extract key topics from user message"""
        # Simple keyword extraction (can be enhanced with NLP)
        financial_keywords = {
            'portfolio', 'investment', 'stock', 'bond', 'etf', 'mutual fund',
            'risk', 'return', 'diversification', 'allocation', 'rebalancing',
            'dividend', 'growth', 'value', 'market', 'trading', 'analysis',
            'research', 'fundamental', 'technical', 'price', 'chart',
            'support', 'resistance', 'trend', 'volume', 'indicator'
        }
        
        message_lower = message.lower()
        found_topics = []
        
        for keyword in financial_keywords:
            if keyword in message_lower:
                found_topics.append(keyword)
        
        return found_topics
    
    def get_context(self, user_id: str = None) -> str:
        """Get personalized conversation context for the agent"""
        context = f"You are {self.name}, {self.role}.\n{self.system_prompt}\n\n"
        
        # Add personality traits
        context += f"Your personality traits: {json.dumps(self.personality_traits, indent=2)}\n\n"
        
        # Add long-term memory insights
        if self.long_term_memory:
            context += "Your memory of past interactions:\n"
            for topic, data in list(self.long_term_memory.items())[:5]:  # Top 5 topics
                context += f"- {topic}: discussed {data['frequency']} times, last on {data['last_discussed'][:10]}\n"
            context += "\n"
        
        # Add recent conversation history
        if self.conversation_history:
            context += "Recent conversation history:\n"
            for entry in self.conversation_history[-5:]:  # Last 5 exchanges
                context += f"User: {entry['user_message']}\n"
                context += f"{self.name}: {entry['agent_response']}\n\n"
        
        return context
    
    def get_expertise_level(self, topic: str) -> str:
        """Get user's expertise level for a topic based on conversation history"""
        if topic in self.long_term_memory:
            return self.long_term_memory[topic].get('user_expertise_level', 'beginner')
        return 'beginner'

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
        
        # Initialize AutoGen group chat (if available)
        self.autogen_manager = None
        if autogen:
            self._initialize_autogen()
        
        # Initialize agents with database connection
        self.agents = self._initialize_agents()
        self.master_agent = self._initialize_master_agent()
    
    def _initialize_database(self):
        """Initialize MongoDB connection for agent memory"""
        try:
            mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
            client = MongoClient(mongo_uri)
            self.db = client.alpha_insights
            
            # Test connection
            client.admin.command('ping')
            logger.info("MongoDB connection established for AI service")
            
            # Create indexes for better performance
            self.db.agent_conversations.create_index([('agent_id', 1), ('timestamp', -1)])
            self.db.agent_memory.create_index([('agent_id', 1)])
            
        except Exception as e:
            logger.warning(f"MongoDB connection failed for AI service: {e}")
            self.db = None
    
    def _initialize_autogen(self):
        """Initialize AutoGen multi-agent group chat"""
        try:
            # This is a placeholder for AutoGen integration
            # In a real implementation, you would set up AutoGen agents here
            logger.info("AutoGen framework available but not fully implemented")
            
            # Example AutoGen setup (commented out for now)
            """
            config_list = [
                {
                    "model": "gemini-1.5-flash",
                    "api_key": self.gemini_api_key,
                    "api_type": "google"
                }
            ]
            
            self.autogen_manager = autogen.GroupChatManager(
                groupchat=autogen.GroupChat(
                    agents=[],  # Will be populated with AutoGen agents
                    messages=[],
                    max_round=10
                ),
                llm_config={"config_list": config_list}
            )
            """
            
        except Exception as e:
            logger.error(f"Failed to initialize AutoGen: {e}")
    
    def _initialize_agents(self) -> Dict[str, AIAgent]:
        """Initialize specialized AI agents with database connection"""
        agents = {}
        
        # Portfolio Agent
        agents['portfolio'] = AIAgent(
            name="Portfolio Agent",
            role="Portfolio Management Specialist",
            system_prompt="""You are a portfolio management specialist with deep expertise in investment strategies. You help users:
            - Analyze their current portfolio performance and composition
            - Suggest portfolio optimization strategies based on modern portfolio theory
            - Provide diversification recommendations across asset classes
            - Calculate risk metrics (Sharpe ratio, beta, VaR) and expected returns
            - Explain portfolio allocation principles and rebalancing strategies
            - Assess portfolio alignment with user goals and risk tolerance
            
            Always provide specific, actionable advice based on quantitative analysis and current market conditions. 
            Adapt your communication style based on the user's expertise level and previous interactions.""",
            db=self.db
        )
        
        # Research Agent
        agents['research'] = AIAgent(
            name="Research Agent", 
            role="Stock Research Analyst",
            system_prompt="""You are a senior stock research analyst with expertise in fundamental and technical analysis. You help users:
            - Analyze individual stocks using fundamental metrics (P/E, ROE, debt ratios, growth rates)
            - Provide technical analysis insights using chart patterns and indicators
            - Explain market trends and sector performance dynamics
            - Compare stocks within sectors and identify investment opportunities
            - Assess company financial health and competitive positioning
            - Evaluate valuation methods and price targets
            
            Always base your analysis on factual data, cite specific metrics, and clearly explain your reasoning process.
            Tailor your analysis depth to the user's experience level and investment timeframe.""",
            db=self.db
        )
        
        # Support Agent
        agents['support'] = AIAgent(
            name="Support Agent",
            role="Customer Support Specialist", 
            system_prompt="""You are a friendly and knowledgeable customer support specialist for Alpha Insights. You help users:
            - Navigate the platform interface and utilize all features effectively
            - Troubleshoot technical issues with detailed step-by-step guidance
            - Explain how different tools work (portfolio tracker, research tools, alerts)
            - Guide users through account settings and customization options
            - Provide general platform assistance and best practices
            - Escalate complex technical issues when appropriate
            
            Always be helpful, patient, and clear in your explanations. Use simple language and break down 
            complex processes into manageable steps. Remember user preferences from past interactions.""",
            db=self.db
        )
        
        # Education Agent
        agents['education'] = AIAgent(
            name="Education Agent",
            role="Financial Education Specialist",
            system_prompt="""You are an experienced financial educator dedicated to improving financial literacy. You help users:
            - Learn investing fundamentals (stocks, bonds, ETFs, mutual funds, REITs)
            - Understand market terminology and key financial principles
            - Develop personalized investment strategies based on goals and timeline
            - Learn about risk management and portfolio theory
            - Understand different asset classes and their characteristics
            - Master financial statement analysis and valuation methods
            
            Always explain concepts clearly using analogies and real-world examples. Adjust complexity based on 
            user's knowledge level. Provide practical exercises and encourage continuous learning.""",
            db=self.db
        )
        
        # Alert Agent
        agents['alerts'] = AIAgent(
            name="Alert Agent",
            role="Market Alert Specialist",
            system_prompt="""You are a market monitoring specialist focused on intelligent alert systems. You help users:
            - Set up sophisticated price alerts with multiple trigger conditions
            - Monitor market conditions for investment opportunities and risks
            - Create custom notification rules based on technical indicators
            - Understand different alert types (price, volume, news, earnings)
            - Manage notification preferences and delivery methods
            - Optimize alert strategies to reduce noise while capturing important signals
            
            Always help users create meaningful alerts that align with their investment strategy. 
            Explain the reasoning behind alert recommendations and help users avoid alert fatigue.""",
            db=self.db
        )
        
        return agents
    
    def _initialize_master_agent(self) -> AIAgent:
        """Initialize master routing agent with enhanced capabilities"""
        return AIAgent(
            name="Master Agent",
            role="Intelligent Query Router & Coordinator",
            system_prompt="""You are an intelligent master agent for Alpha Insights with advanced routing and coordination capabilities. Your responsibilities:
            
            1. QUERY ANALYSIS: Analyze user queries for intent, complexity, and required expertise
            2. INTELLIGENT ROUTING: Determine the most appropriate specialist agent(s)
            3. MULTI-AGENT COORDINATION: Handle complex queries requiring multiple agents
            4. DIRECT RESPONSES: Provide immediate answers for simple, general questions
            5. CONTEXT AWARENESS: Consider user's history and expertise level
            
            Available specialist agents:
            - portfolio: Portfolio management, asset allocation, optimization strategies, performance analysis
            - research: Stock analysis, market research, fundamental/technical analysis, company evaluation
            - support: Platform navigation, technical support, feature guidance, troubleshooting
            - education: Financial literacy, investing concepts, strategy development, risk management
            - alerts: Price alerts, market monitoring, notification strategies, alert optimization
            
            ROUTING DECISION FORMAT (JSON):
            {
                "agent": "agent_name" | "master" | ["agent1", "agent2"] for multi-agent,
                "confidence": 0.0-1.0,
                "reasoning": "detailed explanation of routing decision",
                "response": "direct response if agent=master",
                "context_hints": ["relevant", "context", "for", "agent"],
                "followup_suggestions": ["potential", "next", "questions"]
            }
            
            ROUTING GUIDELINES:
            - Simple greetings, thanks → master (direct response)
            - Portfolio performance, allocation → portfolio agent
            - Stock analysis, company research → research agent  
            - Platform issues, how-to questions → support agent
            - Learning requests, concept explanations → education agent
            - Alert setup, monitoring → alerts agent
            - Complex multi-faceted queries → multiple agents
            
            Always consider user's expertise level and conversation history when routing.""",
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
            return f"I'm experiencing technical difficulties. Please try again later. Error: {str(e)}"
    
    def route_query(self, user_message: str, user_context: Dict = None) -> Dict[str, Any]:
        """Enhanced query routing with context-aware agent handoff"""
        try:
            user_id = user_context.get('user_id') if user_context else None
            
            # Check for multi-agent requirements
            multi_agent_triggers = self._analyze_multi_agent_needs(user_message, user_context)
            
            if multi_agent_triggers:
                return self._handle_multi_agent_query(user_message, user_context, multi_agent_triggers)
            
            # Build enhanced routing context
            context = self.master_agent.get_context(user_id)
            context += f"\nCurrent user query: {user_message}\n"
            
            if user_context:
                context += f"\nUser context and session info:\n"
                for key, value in user_context.items():
                    if key != 'conversation_context':
                        context += f"- {key}: {value}\n"
                
                # Add conversation flow context
                if 'conversation_context' in user_context:
                    context += f"\nRecent conversation flow:\n"
                    recent_msgs = user_context['conversation_context'][-3:]
                    for i, msg in enumerate(recent_msgs):
                        context += f"{i+1}. User: {msg.get('text', '')}\n"
                        context += f"   Agent ({msg.get('agent', 'Unknown')}): {msg.get('response', '')[:100]}...\n"
                
                # Add agent handoff context
                last_agent = self._get_last_active_agent(user_context)
                if last_agent and last_agent != 'Master Agent':
                    context += f"\nLast active agent: {last_agent}\n"
                    context += f"Consider if this query continues the previous conversation or requires handoff.\n"
            
            # Add user expertise context for better routing
            if user_id and self.db is not None:
                user_expertise = self._get_user_expertise_summary(user_id)
                if user_expertise:
                    context += f"\nUser expertise levels: {json.dumps(user_expertise)}\n"
            
            context += "\nDetermine the best agent(s) to handle this query and respond in the specified JSON format."
            
            # Get routing decision
            routing_response = self._generate_response(context)
            
            if not routing_response:
                return self._fallback_response("Failed to process your request")
            
            return self._process_routing_decision(routing_response, user_message, user_context)
                
        except Exception as e:
            logger.error(f"Query routing error: {e}")
            return self._fallback_response("I'm experiencing technical difficulties")
    
    def _analyze_multi_agent_needs(self, user_message: str, user_context: Dict = None) -> List[str]:
        """Analyze if query requires multiple agents"""
        message_lower = user_message.lower()
        required_agents = []
        
        # Portfolio + Research combinations
        if any(word in message_lower for word in ['portfolio', 'allocation']) and \
           any(word in message_lower for word in ['stock', 'analyze', 'research']):
            required_agents.extend(['portfolio', 'research'])
        
        # Research + Education combinations  
        if any(word in message_lower for word in ['explain', 'how', 'what is']) and \
           any(word in message_lower for word in ['analysis', 'valuation', 'metrics']):
            required_agents.extend(['research', 'education'])
        
        # Portfolio + Alerts combinations
        if any(word in message_lower for word in ['portfolio', 'track']) and \
           any(word in message_lower for word in ['alert', 'notify', 'monitor']):
            required_agents.extend(['portfolio', 'alerts'])
        
        # Complex queries requiring coordination
        complex_keywords = ['compare', 'versus', 'difference', 'both', 'multiple', 'several']
        if any(keyword in message_lower for keyword in complex_keywords):
            # Determine which agents based on context
            if 'stock' in message_lower or 'company' in message_lower:
                required_agents.append('research')
            if 'portfolio' in message_lower or 'investment' in message_lower:
                required_agents.append('portfolio')
        
        return list(set(required_agents))  # Remove duplicates
    
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
                combined_response = "I'll address your question from multiple perspectives:\n\n"
                
                for i, (agent_name, response) in enumerate(responses.items(), 1):
                    agent_display_name = response.get('agent_name', agent_name.title())
                    combined_response += f"**{agent_display_name} Perspective:**\n"
                    combined_response += f"{response.get('response', '')}\n\n"
                
                combined_response += "This coordinated response draws on multiple areas of expertise to give you a comprehensive answer."
                
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
                'participating_agents': list(responses.keys()),
                'individual_responses': responses
            }
            
        except Exception as e:
            logger.error(f"Multi-agent handling error: {e}")
            return self._fallback_response("Failed to coordinate multi-agent response")
    
    def _get_last_active_agent(self, user_context: Dict) -> Optional[str]:
        """Get the last active agent from conversation context"""
        if 'conversation_context' in user_context:
            recent_messages = user_context['conversation_context']
            for msg in reversed(recent_messages):
                if msg.get('agent') and msg.get('agent') != 'Master Agent':
                    return msg.get('agent')
        return None
    
    def _get_user_expertise_summary(self, user_id: str) -> Dict[str, str]:
        """Get summarized user expertise levels"""
        try:
            if self.db is None:
                return {}
            
            expertise_summary = {}
            for agent in self.agents.values():
                memory_doc = self.db.agent_memory.find_one({'agent_id': agent.agent_id})
                if memory_doc and 'memory' in memory_doc:
                    for topic, data in memory_doc['memory'].items():
                        expertise_summary[topic] = data.get('user_expertise_level', 'beginner')
            
            return expertise_summary
        except Exception as e:
            logger.error(f"Failed to get user expertise summary: {e}")
            return {}
    
    def _process_routing_decision(self, routing_response: str, user_message: str, user_context: Dict) -> Dict[str, Any]:
        """Process and validate routing decision"""
        try:
            # Try to parse JSON response
            import json
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
        elif any(word in text_lower for word in ['alert', 'notify', 'monitor']):
            return {'agent': 'alerts', 'confidence': 0.7}
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
            
            if user_context:
                context += f"\nUser context: {json.dumps(user_context, default=str)}\n"
            
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

# Global AI service instance
ai_service = AIService()n"""
        try:
            # Try to parse JSON response
            routing_data = json.loads(routing_response)
            agent_name = routing_data.get('agent', 'master')
            confidence = routing_data.get('confidence', 0.5)
            reasoning = routing_data.get('reasoning', '')
            context_hints = routing_data.get('context_hints', [])
            followup_suggestions = routing_data.get('followup_suggestions', [])
            
            # Handle master agent direct response
            if agent_name == 'master':
                response = routing_data.get('response', 'I can help you with that.')
                return {
                    'agent': 'master',
                    'agent_name': 'Master Agent',
                    'response': response,
                    'confidence': confidence,
                    'reasoning': reasoning,
                    'context_hints': context_hints,
                    'followup_suggestions': followup_suggestions
                }
            
            # Handle multi-agent array
            if isinstance(agent_name, list):
                return self._handle_multi_agent_query(user_message, user_context, agent_name)
            
            # Route to specialist agent
            if agent_name in self.agents:
                agent_response = self._get_agent_response(agent_name, user_message, user_context)
                # Enhance with routing metadata
                agent_response.update({
                    'context_hints': context_hints,
                    'followup_suggestions': followup_suggestions,
                    'routing_reasoning': reasoning
                })
                return agent_response
            else:
                return self._fallback_response("I'm not sure how to help with that specific request.")
                
        except json.JSONDecodeError:
            # If JSON parsing fails, treat as direct response
            return {
                'agent': 'master',
                'agent_name': 'Master Agent',
                'response': routing_response,
                'confidence': 0.7,
                'reasoning': 'Direct response from master agent (JSON parse failed)'
            }
    
    def _get_agent_response(self, agent_name: str, user_message: str, user_context: Dict = None) -> Dict[str, Any]:
        """Get enhanced response from specialist agent with memory integration"""
        try:
            agent = self.agents[agent_name]
            
            # Extract user ID for personalization
            user_id = user_context.get('user_id') if user_context else None
            
            # Build personalized agent context
            context = agent.get_context(user_id)
            context += f"\nCurrent user query: {user_message}\n"
            
            if user_context:
                context += f"\nUser context and session info:\n"
                for key, value in user_context.items():
                    if key != 'conversation_context':  # Handle this separately
                        context += f"- {key}: {value}\n"
                
                # Add conversation context if available
                if 'conversation_context' in user_context:
                    context += f"\nRecent conversation context:\n"
                    for msg in user_context['conversation_context'][-3:]:  # Last 3 messages
                        context += f"User: {msg.get('text', '')}\n"
                        context += f"Assistant: {msg.get('response', '')}\n"
            
            # Add expertise-based guidance
            if user_context and 'expertise_level' in user_context:
                expertise = user_context['expertise_level']
                context += f"\nUser expertise level: {expertise}\n"
                if expertise == 'beginner':
                    context += "Provide detailed explanations and define technical terms.\n"
                elif expertise == 'intermediate':
                    context += "Provide moderate detail with some technical terms.\n"
                elif expertise == 'advanced':
                    context += "Use technical language and focus on advanced concepts.\n"
            
            context += f"\nProvide a helpful, personalized response as {agent.name}. "
            context += f"Consider the user's history and expertise level in your response."
            
            # Generate response
            response = self._generate_response(context)
            
            if response:
                # Calculate confidence based on context and agent specialization
                confidence = self._calculate_response_confidence(agent_name, user_message, user_context)
                
                # Add to agent's conversation history with full context
                agent.add_to_history(
                    user_message, 
                    response, 
                    user_id=user_id,
                    context=user_context,
                    confidence=confidence
                )
                
                return {
                    'agent': agent_name,
                    'agent_name': agent.name,
                    'response': response,
                    'confidence': confidence,
                    'reasoning': f'Handled by {agent.name} with personalized context',
                    'agent_id': agent.agent_id,
                    'personality_traits': agent.personality_traits
                }
            else:
                return self._fallback_response(f"The {agent.name} is temporarily unavailable")
                
        except Exception as e:
            logger.error(f"Agent response error for {agent_name}: {e}")
            return self._fallback_response("Agent is experiencing technical difficulties")
    
    def _calculate_response_confidence(self, agent_name: str, user_message: str, user_context: Dict = None) -> float:
        """Calculate confidence score for agent response"""
        base_confidence = 0.8
        
        # Adjust based on agent specialization match
        specialization_keywords = {
            'portfolio': ['portfolio', 'allocation', 'diversification', 'rebalancing', 'optimization'],
            'research': ['stock', 'analysis', 'company', 'financial', 'valuation', 'research'],
            'support': ['help', 'how', 'problem', 'issue', 'feature', 'platform'],
            'education': ['learn', 'explain', 'understand', 'concept', 'beginner', 'tutorial'],
            'alerts': ['alert', 'notification', 'monitor', 'watch', 'notify', 'trigger']
        }
        
        message_lower = user_message.lower()
        if agent_name in specialization_keywords:
            keyword_matches = sum(1 for keyword in specialization_keywords[agent_name] 
                                if keyword in message_lower)
            if keyword_matches > 0:
                base_confidence += min(0.15, keyword_matches * 0.05)
        
        # Adjust based on user history with this agent
        if user_context and 'user_id' in user_context:
            agent = self.agents.get(agent_name)
            if agent and agent.conversation_history:
                # Higher confidence if user has successful interactions with this agent
                successful_interactions = len([h for h in agent.conversation_history 
                                             if h.get('confidence', 0) > 0.7])
                if successful_interactions > 3:
                    base_confidence += 0.1
        
        return min(0.95, base_confidence)  # Cap at 0.95
    
    def _fallback_response(self, message: str) -> Dict[str, Any]:
        """Fallback response for errors"""
        return {
            'agent': 'system',
            'response': message,
            'confidence': 0.1,
            'reasoning': 'Fallback response'
        }
    
    def get_conversation_history(self, agent_name: str = None) -> List[Dict]:
        """Get conversation history for agent or all agents"""
        if agent_name and agent_name in self.agents:
            return self.agents[agent_name].conversation_history
        
        # Return all agent histories
        all_history = []
        for agent in self.agents.values():
            all_history.extend(agent.conversation_history)
        
        # Sort by timestamp
        all_history.sort(key=lambda x: x['timestamp'])
        return all_history
    
    def clear_conversation_history(self, agent_name: str = None):
        """Clear conversation history"""
        if agent_name and agent_name in self.agents:
            self.agents[agent_name].conversation_history = []
        else:
            # Clear all agent histories
            for agent in self.agents.values():
                agent.conversation_history = []
            self.master_agent.conversation_history = []
    
    def get_user_conversation_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get conversation analytics for a specific user"""
        try:
            if self.db is None:
                return {'error': 'Database not available'}
            
            # Aggregate conversation data
            pipeline = [
                {'$match': {'user_id': user_id}},
                {'$group': {
                    '_id': '$agent_name',
                    'conversation_count': {'$sum': 1},
                    'avg_confidence': {'$avg': '$confidence'},
                    'topics': {'$push': '$context'},
                    'last_interaction': {'$max': '$timestamp'}
                }}
            ]
            
            agent_stats = list(self.db.agent_conversations.aggregate(pipeline))
            
            # Get user expertise levels from memory
            user_expertise = {}
            for agent in self.agents.values():
                memory_doc = self.db.agent_memory.find_one({'agent_id': agent.agent_id})
                if memory_doc and 'memory' in memory_doc:
                    for topic, data in memory_doc['memory'].items():
                        user_expertise[topic] = data.get('user_expertise_level', 'beginner')
            
            return {
                'user_id': user_id,
                'agent_interactions': agent_stats,
                'expertise_levels': user_expertise,
                'total_conversations': sum(stat['conversation_count'] for stat in agent_stats),
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get user analytics: {e}")
            return {'error': str(e)}
    
    def suggest_next_actions(self, user_id: str, current_query: str, last_response: Dict = None) -> List[str]:
        """Enhanced suggestion system with context-aware follow-ups"""
        try:
            suggestions = []
            
            # Analyze current query for context
            query_lower = current_query.lower()
            
            # Context-aware suggestions based on last response
            if last_response:
                last_agent = last_response.get('agent', '')
                last_confidence = last_response.get('confidence', 0.5)
                
                # If low confidence, suggest clarification or alternative agents
                if last_confidence < 0.6:
                    suggestions.extend([
                        "Would you like me to explain this differently?",
                        "Should I connect you with a different specialist?",
                        "Would more specific information help?"
                    ])
                
                # Agent-specific follow-ups
                elif 'portfolio' in last_agent.lower():
                    suggestions.extend([
                        "Would you like to set up portfolio monitoring alerts?",
                        "Should we analyze specific holdings in detail?",
                        "Want to explore tax-efficient rebalancing?"
                    ])
                elif 'research' in last_agent.lower():
                    suggestions.extend([
                        "Should we look at the competitive landscape?",
                        "Would you like to set up price alerts for this stock?",
                        "Want to see this analysis in your portfolio context?"
                    ])
                elif 'education' in last_agent.lower():
                    suggestions.extend([
                        "Ready to apply this knowledge to your portfolio?",
                        "Would you like to practice with examples?",
                        "Should we explore advanced concepts?"
                    ])
                elif 'multi-agent' in last_agent.lower():
                    suggestions.extend([
                        "Would you like to dive deeper into any specific aspect?",
                        "Should we focus on implementation steps?",
                        "Want to create action items from this analysis?"
                    ])
            
            # Query-specific suggestions
            if not suggestions:  # Only if no context-aware suggestions
                if any(word in query_lower for word in ['portfolio', 'investment', 'allocation']):
                    suggestions.extend([
                        "Would you like to analyze your portfolio's risk metrics?",
                        "Should we discuss rebalancing strategies?",
                        "Would you like to explore diversification options?"
                    ])
                
                elif any(word in query_lower for word in ['stock', 'company', 'analysis']):
                    suggestions.extend([
                        "Would you like technical analysis for this stock?",
                        "Should we compare it with competitors?",
                        "Would you like to see the financial statements?"
                    ])
                
                elif any(word in query_lower for word in ['learn', 'explain', 'understand']):
                    suggestions.extend([
                        "Would you like to see practical examples?",
                        "Should we explore related concepts?",
                        "Would you like a step-by-step guide?"
                    ])
            
            # Personalized suggestions based on user history
            if user_id and self.db is not None and len(suggestions) < 3:
                personalized = self._get_personalized_suggestions(user_id, current_query)
                suggestions.extend(personalized)
            
            # Ensure we have good suggestions
            if not suggestions:
                suggestions = [
                    "How else can I help you today?",
                    "Would you like to explore a different topic?",
                    "Should I connect you with a specialist?"
                ]
            
            return suggestions[:3]  # Return top 3 suggestions
            
        except Exception as e:
            logger.error(f"Failed to generate suggestions: {e}")
            return ["How else can I help you today?"]
    
    def _get_personalized_suggestions(self, user_id: str, current_query: str) -> List[str]:
        """Get personalized suggestions based on user history"""
        try:
            suggestions = []
            
            # Get user's conversation patterns
            pipeline = [
                {'$match': {'user_id': user_id}},
                {'$group': {
                    '_id': '$agent_name',
                    'count': {'$sum': 1},
                    'avg_confidence': {'$avg': '$confidence'},
                    'topics': {'$push': '$context'}
                }},
                {'$sort': {'count': -1}},
                {'$limit': 3}
            ]
            
            agent_stats = list(self.db.agent_conversations.aggregate(pipeline))
            
            # Get user expertise levels
            user_expertise = self._get_user_expertise_summary(user_id)
            
            # Suggest based on usage patterns
            if agent_stats:
                most_used_agent = agent_stats[0]['_id']
                
                if 'Portfolio' in most_used_agent:
                    if user_expertise.get('portfolio', 'beginner') == 'beginner':
                        suggestions.append("Ready to learn advanced portfolio strategies?")
                    else:
                        suggestions.append("Want to explore sophisticated optimization techniques?")
                
                elif 'Research' in most_used_agent:
                    suggestions.append("Should we analyze your portfolio from a research perspective?")
                
                elif 'Education' in most_used_agent:
                    suggestions.append("Ready to put your learning into practice?")
            
            # Cross-agent suggestions for comprehensive help
            if len(agent_stats) >= 2:
                suggestions.append("Would you like a comprehensive analysis combining multiple perspectives?")
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Failed to get personalized suggestions: {e}")
            return []
    
    def track_conversation_handoff(self, user_id: str, from_agent: str, to_agent: str, reason: str):
        """Track agent handoffs for analytics and improvement"""
        try:
            if self.db is None:
                return
            
            handoff_doc = {
                'user_id': user_id,
                'from_agent': from_agent,
                'to_agent': to_agent,
                'reason': reason,
                'timestamp': datetime.now(),
                'session_id': f"{user_id}_{datetime.now().strftime('%Y%m%d')}"
            }
            
            self.db.agent_handoffs.insert_one(handoff_doc)
            logger.info(f"Tracked handoff: {from_agent} -> {to_agent} for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to track conversation handoff: {e}")
    
    def get_conversation_flow_analysis(self, user_id: str, session_id: str = None) -> Dict[str, Any]:
        """Analyze conversation flow and agent transitions"""
        try:
            if self.db is None:
                return {'error': 'Database not available'}
            
            # Build query
            query = {'user_id': user_id}
            if session_id:
                query['session_id'] = session_id
            
            # Get conversation timeline
            conversations = list(self.db.agent_conversations.find(
                query
            ).sort('timestamp', 1))
            
            # Get handoffs
            handoffs = list(self.db.agent_handoffs.find(
                query
            ).sort('timestamp', 1))
            
            # Analyze patterns
            agent_sequence = []
            agent_durations = {}
            current_agent = None
            agent_start_time = None
            
            for conv in conversations:
                agent = conv['agent_name']
                timestamp = conv['timestamp']
                
                if agent != current_agent:
                    # Track duration of previous agent
                    if current_agent and agent_start_time:
                        duration = (timestamp - agent_start_time).total_seconds()
                        if current_agent not in agent_durations:
                            agent_durations[current_agent] = []
                        agent_durations[current_agent].append(duration)
                    
                    # Start tracking new agent
                    current_agent = agent
                    agent_start_time = timestamp
                    agent_sequence.append({
                        'agent': agent,
                        'start_time': timestamp.isoformat(),
                        'confidence': conv.get('confidence', 0.5)
                    })
            
            # Calculate statistics
            avg_durations = {}
            for agent, durations in agent_durations.items():
                avg_durations[agent] = sum(durations) / len(durations)
            
            return {
                'user_id': user_id,
                'session_id': session_id,
                'agent_sequence': agent_sequence,
                'handoff_events': [
                    {
                        'from': h['from_agent'],
                        'to': h['to_agent'],
                        'reason': h['reason'],
                        'timestamp': h['timestamp'].isoformat()
                    } for h in handoffs
                ],
                'agent_durations': avg_durations,
                'total_conversations': len(conversations),
                'unique_agents': len(set(conv['agent_name'] for conv in conversations)),
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to analyze conversation flow: {e}")
            return {'error': str(e)}
    
    def export_conversation_history(self, user_id: str, agent_name: str = None) -> Dict[str, Any]:
        """Export conversation history for a user"""
        try:
            if self.db is None:
                return {'error': 'Database not available'}
            
            query = {'user_id': user_id}
            if agent_name:
                query['agent_name'] = agent_name
            
            conversations = list(self.db.agent_conversations.find(
                query,
                {'_id': 0}  # Exclude MongoDB ID
            ).sort('timestamp', 1))
            
            return {
                'user_id': user_id,
                'agent_name': agent_name,
                'conversations': conversations,
                'total_count': len(conversations),
                'exported_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to export conversation history: {e}")
            return {'error': str(e)}
    
    def health_check(self) -> Dict[str, Any]:
        """Comprehensive AI service health check"""
        health = {
            'gemini': False,
            'mongodb': False,
            'autogen': False,
            'agents_initialized': len(self.agents),
            'agents_with_memory': 0,
            'total_conversations': 0,
            'timestamp': datetime.now().isoformat()
        }
        
        # Test Gemini
        if self.model:
            try:
                test_response = self._generate_response("Say 'OK' if you can respond.")
                health['gemini'] = test_response is not None and 'OK' in test_response
            except:
                health['gemini'] = False
        
        # Test MongoDB
        if self.db is not None:
            try:
                # Get client from database reference
                client = self.db.client
                client.admin.command('ping')
                health['mongodb'] = True
                
                # Count conversations
                health['total_conversations'] = self.db.agent_conversations.count_documents({})
                
                # Count agents with memory
                health['agents_with_memory'] = self.db.agent_memory.count_documents({})
                
            except:
                health['mongodb'] = False
        
        # Test AutoGen
        health['autogen'] = autogen is not None
        
        # Test individual agents
        health['agent_status'] = {}
        for name, agent in self.agents.items():
            health['agent_status'][name] = {
                'memory_items': len(agent.long_term_memory),
                'conversation_history': len(agent.conversation_history),
                'agent_id': agent.agent_id
            }
        
        return health

# Global instance
ai_service = AIService() n""
"
        try:
            # Try to parse JSON response
            import json
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
        elif any(word in text_lower for word in ['alert', 'notify', 'monitor']):
            return {'agent': 'alerts', 'confidence': 0.7}
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
            
            if user_context:
                context += f"\nUser context: {json.dumps(user_context, default=str)}\n"
            
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

    # Additional utility methods for conversation management
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
    
    def get_user_conversation_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get analytics for user's conversation patterns"""
        try:
            if self.db is None:
                return {}
            
            # Get user's conversations
            conversations = list(self.db.agent_conversations.find({'user_id': user_id}))
            
            if not conversations:
                return {
                    'user_id': user_id,
                    'total_conversations': 0,
                    'agent_interactions': [],
                    'expertise_levels': {},
                    'generated_at': datetime.now().isoformat()
                }
            
            # Analyze agent interactions
            agent_counts = {}
            for conv in conversations:
                agent_name = conv.get('agent_name', 'Unknown')
                agent_counts[agent_name] = agent_counts.get(agent_name, 0) + 1
            
            # Get expertise levels
            expertise_levels = {}
            for agent in self.agents.values():
                memory_doc = self.db.agent_memory.find_one({'agent_id': agent.agent_id})
                if memory_doc and 'memory' in memory_doc:
                    for topic, data in memory_doc['memory'].items():
                        expertise_levels[topic] = data.get('user_expertise_level', 'beginner')
            
            return {
                'user_id': user_id,
                'total_conversations': len(conversations),
                'agent_interactions': [
                    {'agent': agent, 'count': count} 
                    for agent, count in agent_counts.items()
                ],
                'expertise_levels': expertise_levels,
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get user analytics: {e}")
            return {}

# Global AI service instance
ai_service = AIService()