try:
    import langchain
    print(f"LangChain version: {langchain.__version__}")
    from langchain.agents import AgentExecutor
    print("AgentExecutor found in langchain.agents")
except ImportError as e:
    print(f"Error: {e}")
    try:
        from langchain.agents.agent import AgentExecutor
        print("AgentExecutor found in langchain.agents.agent")
    except ImportError:
        print("AgentExecutor NOT found in langchain.agents.agent")

try:
    from langchain.agents import create_tool_calling_agent
    print("create_tool_calling_agent found in langchain.agents")
except ImportError as e:
    print(f"Error: {e}")
