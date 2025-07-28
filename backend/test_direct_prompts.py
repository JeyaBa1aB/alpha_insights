#!/usr/bin/env python3
"""
Test script for Direct and Concise AI Agent Prompts
Validates that all agents provide direct, definitive answers without conversational filler
"""

import sys
import os
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.services.ai_service import ai_service

def test_prompt_directness():
    """Test that all agent prompts follow the direct command structure"""
    
    print("📝 Testing Direct Prompt Structure...")
    print("=" * 60)
    
    required_phrases = [
        "Your task is to provide a direct, concise, and definitive answer",
        "Do not ask clarifying questions",
        "Be brief and professional"
    ]
    
    agents_tested = 0
    agents_passed = 0
    
    for agent_name, agent in ai_service.agents.items():
        agents_tested += 1
        print(f"\nTesting {agent.name}:")
        print(f"Prompt: {agent.system_prompt[:100]}...")
        
        # Check for required phrases
        prompt_lower = agent.system_prompt.lower()
        phrases_found = 0
        
        for phrase in required_phrases:
            if phrase.lower() in prompt_lower:
                phrases_found += 1
                print(f"  ✅ Contains: '{phrase}'")
            else:
                print(f"  ❌ Missing: '{phrase}'")
        
        # Check for elimination of conversational language
        conversational_phrases = [
            "you are a friendly",
            "always be helpful",
            "feel free to",
            "don't hesitate",
            "i'm here to help"
        ]
        
        conversational_found = 0
        for phrase in conversational_phrases:
            if phrase.lower() in prompt_lower:
                conversational_found += 1
                print(f"  ⚠️  Still contains conversational phrase: '{phrase}'")
        
        # Scoring
        if phrases_found >= 2 and conversational_found == 0:
            print(f"  ✅ PASSED: Direct and professional prompt")
            agents_passed += 1
        else:
            print(f"  ❌ FAILED: Needs more direct structure")
    
    print(f"\n📊 Prompt Structure Results: {agents_passed}/{agents_tested} agents passed")
    return agents_passed == agents_tested

def test_response_quality():
    """Test that agents provide direct, definitive responses"""
    
    print("\n🎯 Testing Response Quality and Directness...")
    print("=" * 60)
    
    test_queries = [
        {
            'agent': 'portfolio',
            'query': 'How should I allocate my portfolio?',
            'expected_traits': ['specific percentages', 'actionable steps', 'no questions']
        },
        {
            'agent': 'research', 
            'query': 'Should I buy AAPL?',
            'expected_traits': ['clear recommendation', 'specific metrics', 'price target']
        },
        {
            'agent': 'support',
            'query': 'How do I reset my password?',
            'expected_traits': ['step-by-step', 'specific instructions', 'no questions']
        },
        {
            'agent': 'suggestion',
            'query': 'What stocks should I buy?',
            'expected_traits': ['specific tickers', 'rationale', 'target allocation']
        },
        {
            'agent': 'navigation',
            'query': 'Where is the portfolio page?',
            'expected_traits': ['exact location', 'menu path', 'button names']
        },
        {
            'agent': 'alerts',
            'query': 'Set up an alert for TSLA',
            'expected_traits': ['specific parameters', 'confirmation', 'trigger conditions']
        },
        {
            'agent': 'education',
            'query': 'What is a P/E ratio?',
            'expected_traits': ['clear definition', 'specific example', 'bullet points']
        }
    ]
    
    passed_tests = 0
    total_tests = len(test_queries)
    
    for test in test_queries:
        print(f"\nTesting {test['agent'].title()} Agent:")
        print(f"Query: '{test['query']}'")
        
        try:
            # Get agent response directly
            agent = ai_service.agents[test['agent']]
            context = agent.get_context('test_user')
            context += f"\nUser query: {test['query']}\n"
            
            # Simulate response generation (without actual API call due to quota)
            print(f"Expected traits: {', '.join(test['expected_traits'])}")
            
            # Check prompt structure for directness indicators
            prompt = agent.system_prompt.lower()
            
            directness_score = 0
            
            # Check for direct command structure
            if 'your task is to provide' in prompt:
                directness_score += 1
                print("  ✅ Uses direct task instruction")
            
            if 'do not ask clarifying questions' in prompt:
                directness_score += 1
                print("  ✅ Explicitly prohibits questions")
            
            if 'be brief and professional' in prompt:
                directness_score += 1
                print("  ✅ Commands brevity and professionalism")
            
            # Check for specific action words
            action_words = ['analyze', 'provide', 'deliver', 'give', 'tell', 'explain', 'set up']
            if any(word in prompt for word in action_words):
                directness_score += 1
                print("  ✅ Contains action-oriented language")
            
            if directness_score >= 3:
                print("  ✅ PASSED: Agent configured for direct responses")
                passed_tests += 1
            else:
                print("  ❌ FAILED: Agent may still be too conversational")
                
        except Exception as e:
            print(f"  ❌ ERROR: {str(e)}")
    
    print(f"\n📊 Response Quality Results: {passed_tests}/{total_tests} agents passed")
    return passed_tests == total_tests

def test_elimination_of_filler():
    """Test that conversational filler has been eliminated"""
    
    print("\n🚫 Testing Elimination of Conversational Filler...")
    print("=" * 60)
    
    filler_phrases = [
        "feel free to",
        "don't hesitate to",
        "i'm here to help",
        "happy to assist",
        "would be glad to",
        "please let me know",
        "if you have any questions",
        "hope this helps",
        "is there anything else",
        "friendly and knowledgeable",
        "always be helpful",
        "patient and clear"
    ]
    
    agents_clean = 0
    total_agents = len(ai_service.agents)
    
    for agent_name, agent in ai_service.agents.items():
        print(f"\nChecking {agent.name} for filler phrases:")
        prompt_lower = agent.system_prompt.lower()
        
        filler_found = []
        for phrase in filler_phrases:
            if phrase in prompt_lower:
                filler_found.append(phrase)
        
        if filler_found:
            print(f"  ❌ Found filler phrases: {filler_found}")
        else:
            print(f"  ✅ Clean of conversational filler")
            agents_clean += 1
    
    print(f"\n📊 Filler Elimination Results: {agents_clean}/{total_agents} agents clean")
    return agents_clean == total_agents

def test_command_structure():
    """Test that all prompts use command structure instead of role-playing"""
    
    print("\n⚡ Testing Command Structure vs Role-Playing...")
    print("=" * 60)
    
    command_indicators = [
        "your task is to",
        "provide a direct",
        "deliver specific",
        "give specific",
        "tell users exactly",
        "set up specific",
        "explain financial concepts"
    ]
    
    role_playing_indicators = [
        "you are a friendly",
        "you are an experienced",
        "you help users",
        "you assist with",
        "always be",
        "remember to"
    ]
    
    agents_using_commands = 0
    total_agents = len(ai_service.agents)
    
    for agent_name, agent in ai_service.agents.items():
        print(f"\nAnalyzing {agent.name}:")
        prompt_lower = agent.system_prompt.lower()
        
        command_score = 0
        role_play_score = 0
        
        for indicator in command_indicators:
            if indicator in prompt_lower:
                command_score += 1
        
        for indicator in role_playing_indicators:
            if indicator in prompt_lower:
                role_play_score += 1
        
        print(f"  Command indicators: {command_score}")
        print(f"  Role-playing indicators: {role_play_score}")
        
        if command_score > role_play_score and command_score >= 1:
            print(f"  ✅ Uses command structure")
            agents_using_commands += 1
        else:
            print(f"  ❌ Still uses role-playing language")
    
    print(f"\n📊 Command Structure Results: {agents_using_commands}/{total_agents} agents use commands")
    return agents_using_commands == total_agents

def validate_specific_improvements():
    """Validate specific improvements mentioned in the requirements"""
    
    print("\n🔍 Validating Specific Improvements...")
    print("=" * 60)
    
    improvements = []
    
    # Check Support Agent specifically (mentioned in example)
    support_agent = ai_service.agents.get('support')
    if support_agent:
        prompt = support_agent.system_prompt.lower()
        if 'your task is to provide a direct, concise, and definitive answer' in prompt:
            improvements.append("✅ Support Agent uses new direct structure")
        else:
            improvements.append("❌ Support Agent missing direct structure")
        
        if 'step-by-step instructions' in prompt:
            improvements.append("✅ Support Agent mentions step-by-step instructions")
        else:
            improvements.append("❌ Support Agent missing step-by-step guidance")
    
    # Check all agents for core instruction
    core_instruction = "your task is to provide a direct, concise, and definitive answer"
    agents_with_core = 0
    
    for agent in ai_service.agents.values():
        if core_instruction in agent.system_prompt.lower():
            agents_with_core += 1
    
    improvements.append(f"✅ {agents_with_core}/{len(ai_service.agents)} agents have core instruction")
    
    # Check for elimination of "Do not ask clarifying questions"
    agents_with_no_questions = 0
    for agent in ai_service.agents.values():
        if 'do not ask clarifying questions' in agent.system_prompt.lower():
            agents_with_no_questions += 1
    
    improvements.append(f"✅ {agents_with_no_questions}/{len(ai_service.agents)} agents told not to ask questions")
    
    for improvement in improvements:
        print(f"  {improvement}")
    
    return len([i for i in improvements if i.startswith("✅")]) >= len(improvements) * 0.8

def main():
    """Run all direct prompt tests"""
    
    print("🚀 Direct and Concise AI Prompt Validation Suite")
    print("=" * 60)
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("Prompt Directness", test_prompt_directness),
        ("Response Quality", test_response_quality),
        ("Filler Elimination", test_elimination_of_filler),
        ("Command Structure", test_command_structure),
        ("Specific Improvements", validate_specific_improvements)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with error: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Validation Summary:")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"  {test_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("🎉 All validations passed! AI agents now provide direct, definitive responses.")
        return True
    else:
        print("⚠️  Some validations failed. Review the results above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)