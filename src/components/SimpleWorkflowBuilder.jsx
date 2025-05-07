"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Plus, MessageSquare, Settings, Wrench, Save, FolderOpen, Play, Search, Mail, FileText, Calendar, BarChart } from 'lucide-react';
import { GoogleServiceConnector } from './GoogleAuth';
import { getConfigForm } from './ToolConfigForms';

// Custom X icon component
const CloseIcon = ({ size = 18 }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18"></path>
    <path d="m6 6 12 12"></path>
  </svg>
);

// Google Products requiring OAuth2
const AVAILABLE_TOOLS = [
  { 
    id: 1, 
    name: 'Gmail', 
    description: 'Access and process emails from Gmail', 
    category: 'google', 
    service: 'gmail',
    icon: Mail,
    requiresAuth: true 
  },
  { 
    id: 2, 
    name: 'Google Drive', 
    description: 'Access and manage files in Google Drive', 
    category: 'google', 
    service: 'drive',
    icon: FileText,
    requiresAuth: true 
  },
  { 
    id: 3, 
    name: 'Google Calendar', 
    description: 'Access and manage Google Calendar events', 
    category: 'google', 
    service: 'calendar',
    icon: Calendar,
    requiresAuth: true 
  },
  { 
    id: 4, 
    name: 'Google Sheets', 
    description: 'Access and manage Google Sheets data', 
    category: 'google', 
    service: 'sheets',
    icon: BarChart,
    requiresAuth: true 
  }
];

export default function SimpleWorkflowBuilder() {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showComponentSelector, setShowComponentSelector] = useState(false);
  const [expandedToolNodeId, setExpandedToolNodeId] = useState(null);
  const [searchQueries, setSearchQueries] = useState({});
  // We still need googleUser for checking authentication status
  // but we don't need to update it since we removed the Google auth UI
  const [googleUser] = useState(null);
  const [connectedServices, setConnectedServices] = useState({});
  
  const workflowAreaRef = useRef(null);
  
  // We still need googleUser state for tool authentication
  // but no longer need the explicit auth success handler
  
  // Handle connecting to a Google service
  const handleConnectService = (service) => {
    // This will now use our custom Google authentication flow
    // The actual authentication happens in the GoogleServiceConnector component
    
    // After authentication, update the connected services state
    setConnectedServices({
      ...connectedServices,
      [service]: true
    });
  };
  
  // Handle selecting a tool and showing its configuration
  const handleToolSelection = (nodeId, tool) => {
    // Always update the node with the selected tool and set it as active
    // regardless of authentication status
    const updatedNodes = nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          tools: [tool], // Replace any existing tools with just this one
          activeToolId: tool.id // Mark this tool as active to show config
        };
      }
      return n;
    });
    
    setNodes(updatedNodes);
    
    // Close the tool selector immediately
    setExpandedToolNodeId(null);
    
    // If it's a Google tool that requires authentication, handle the connection
    if (tool.requiresAuth && tool.category === 'google') {
      // If user is authenticated with Google but service not connected yet
      if (!connectedServices[tool.service]) {
        handleConnectService(tool.service);
      }
    }
  };
  
  // Reset tool selection and go back to search mode
  const resetToolSelection = (nodeId) => {
    const updatedNodes = nodes.map(n => 
      n.id === nodeId ? {...n, tools: [], activeToolId: null} : n
    );
    setNodes(updatedNodes);
    setSearchQueries({...searchQueries, [nodeId]: ''});
    setExpandedToolNodeId(nodeId);
  };
  
  // Find a position that doesn't overlap with existing nodes
  const findNonOverlappingPosition = (baseX, baseY) => {
    // Default dimensions for a node
    const nodeWidth = 256; // w-64 is 16rem which is 256px
    const nodeHeight = 120; // approximate height
    const padding = 20; // space between nodes
    
    let newX = baseX;
    let newY = baseY;
    let foundPosition = false;
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loops
    
    while (!foundPosition && attempts < maxAttempts) {
      foundPosition = true;
      
      for (const node of nodes) {
        // Check if the new position overlaps with this node
        if (
          newX < node.x + nodeWidth + padding &&
          newX + nodeWidth + padding > node.x &&
          newY < node.y + nodeHeight + padding &&
          newY + nodeHeight + padding > node.y
        ) {
          // Overlap detected, try a new position
          foundPosition = false;
          
          // Move diagonally down and right
          newX += 30;
          newY += 30;
          
          break;
        }
      }
      
      attempts++;
    }
    
    return { x: newX, y: newY };
  };
  
  // Function to add a component at a specific position
  // This is now only called from the sidebar buttons
  
  const addComponent = (type, x, y) => {
    // Default position if not provided
    if (x === undefined || y === undefined) {
      const workflowRect = workflowAreaRef.current.getBoundingClientRect();
      x = workflowRect.width / 2 - 128; // Half of w-64
      y = workflowRect.height / 3; // A third from the top
    }
    
    // Find a position that doesn't overlap with existing nodes
    const position = findNonOverlappingPosition(x, y);
    
    const newNode = {
      id: Date.now().toString(),
      type,
      x: position.x,
      y: position.y,
      content: '',
      tools: [],
      activeToolId: null
    };
    
    setNodes([...nodes, newNode]);
    setShowComponentSelector(false);
  };
  
  const deleteNode = (id) => {
    setNodes(nodes.filter(node => node.id !== id));
  };
  
  // Add grid pattern style
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .grid-pattern {
        background-size: 20px 20px;
        background-image:
          linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  const handleMouseMove = (e) => {
    if (activeNodeId) {
      const node = nodes.find(n => n.id === activeNodeId);
      if (node) {
        const newX = e.clientX - offset.x;
        const newY = e.clientY - offset.y;
        
        // Update the node position
        setNodes(nodes.map(n => 
          n.id === activeNodeId ? {...n, x: newX, y: newY} : n
        ));
      }
    }
  };
  
  const handleMouseUp = () => {
    setActiveNodeId(null);
  };
  
  useEffect(() => {
    if (activeNodeId !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeNodeId, offset]);
  
  const handleMouseDown = (e, nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      e.stopPropagation();
      setActiveNodeId(nodeId);
      
      // Calculate the offset from the mouse position to the node's top-left corner
      setOffset({
        x: e.clientX - node.x,
        y: e.clientY - node.y
      });
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Workflow Builder</h1>
        <div className="flex space-x-2">
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center">
            <Play size={16} className="mr-1" />
            <span>Test</span>
          </button>
          <button className="bg-white hover:bg-gray-100 text-blue-600 px-4 py-2 rounded flex items-center">
            <Save size={16} className="mr-1" />
            <span>Save</span>
          </button>
          <button className="bg-white hover:bg-gray-100 text-blue-600 px-4 py-2 rounded flex items-center">
            <FolderOpen size={16} className="mr-1" />
            <span>Load</span>
          </button>
        </div>
      </div>
      
      <div className="flex flex-1">
        {/* Add Component sidebar - moved to left side */}
        <div className="w-64 bg-gray-100 p-4 border-r border-gray-300">
          <h2 className="text-lg font-medium mb-2">Add Component</h2>
          <div className="space-y-2">
            <button 
              className="w-full bg-green-100 hover:bg-green-200 text-green-800 p-2 rounded flex items-center"
              onClick={() => addComponent('starter')}
            >
              <Plus size={18} className="mr-2" />
              <span>Starter</span>
            </button>
            
            <button 
              className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 p-2 rounded flex items-center"
              onClick={() => addComponent('prompt')}
            >
              <MessageSquare size={18} className="mr-2" />
              <span>Prompt</span>
            </button>
            
            <button 
              className="w-full bg-purple-100 hover:bg-purple-200 text-purple-800 p-2 rounded flex items-center"
              onClick={() => addComponent('tool')}
            >
              <Wrench size={18} className="mr-2" />
              <span>Tool</span>
            </button>
          </div>
        </div>
        
        <div 
          ref={workflowAreaRef}
          className="flex-1 relative overflow-auto grid-pattern min-h-screen"
          onClick={() => setExpandedToolNodeId(null)}
        >
          {/* Empty state - no nodes */}
          
          {/* Nodes */}
          {nodes.map(node => (
            <div 
              key={node.id}
              className={`absolute p-4 rounded-lg shadow-lg w-64 cursor-move transition-shadow hover:shadow-xl ${
                node.type === 'starter' ? 'bg-green-100 border-2 border-green-500' : 
                node.type === 'prompt' ? 'bg-blue-100 border-2 border-blue-500' : 
                'bg-purple-100 border-2 border-purple-500'
              }`}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              style={{ left: `${node.x}px`, top: `${node.y}px` }}
            >
              <div className="flex justify-between items-center mb-2 select-none">
                <div className="font-medium">
                  {node.type === 'starter' ? 'Conversation Starter' : 
                   node.type === 'prompt' ? 'Prompt' : 
                   (node.tools?.length === 1 ? node.tools[0].name : 'Tool')}
                </div>
                <button 
                  className="text-gray-500 hover:text-red-600 transition-colors duration-200 p-1 rounded-full hover:bg-red-100" 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNode(node.id);
                  }}
                  title="Delete node"
                >
                  <CloseIcon size={18} />
                </button>
              </div>
              
              {node.type === 'tool' ? (
                <div>
                  {/* If a tool is selected and active, show its configuration */}
                  {node.tools?.length === 1 && node.activeToolId ? (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium text-sm flex items-center">
                          {node.tools[0].icon && React.createElement(node.tools[0].icon, { size: 14, className: "mr-1 text-purple-600" })}
                          {node.tools[0].name}
                        </div>
                        <button 
                          className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100" 
                          onClick={() => resetToolSelection(node.id)}
                          title="Change tool"
                        >
                          <Search size={16} />
                        </button>
                      </div>
                      
                      {/* Tool-specific configuration forms */}
                      {node.tools[0].service && getConfigForm(node.tools[0].service, connectedServices, handleConnectService)}
                    </div>
                  ) : (
                    <div>
                      {/* Search input */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search size={16} className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Search for tools..."
                          value={searchQueries[node.id] || ''}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            setSearchQueries({
                              ...searchQueries,
                              [node.id]: e.target.value
                            });
                            setExpandedToolNodeId(node.id);
                          }}
                          onClick={() => {
                            setExpandedToolNodeId(expandedToolNodeId === node.id ? null : node.id);
                          }}
                        />
                      </div>
                      
                      {/* Tool search results - directly embedded in the node */}
                      {expandedToolNodeId === node.id && (
                        <div className="mt-2 bg-white rounded-lg border border-gray-200 p-2 max-h-60 overflow-y-auto relative">
                          <button 
                            className="absolute -top-2 -right-2 bg-gray-200 rounded-full p-1 hover:bg-gray-300 z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedToolNodeId(null);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <CloseIcon size={12} />
                          </button>
                          
                          {AVAILABLE_TOOLS
                            .filter(tool => {
                              const query = searchQueries[node.id] || '';
                              if (!query.trim()) return true;
                              return (
                                tool.name.toLowerCase().includes(query.toLowerCase()) ||
                                tool.description.toLowerCase().includes(query.toLowerCase())
                              );
                            })
                            .slice(0, searchQueries[node.id]?.trim() ? 3 : AVAILABLE_TOOLS.length)
                            .map(tool => {
                              const isSelected = node.tools?.some(t => t.id === tool.id) || false;
                              
                              return (
                                <div 
                                  key={tool.id}
                                  className={`p-2 rounded mb-1 cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-purple-50 border border-purple-200' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // When a tool is clicked, immediately select it and show its configuration
                                    handleToolSelection(node.id, tool);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="font-medium text-sm flex items-center">
                                      {tool.icon && React.createElement(tool.icon, { size: 14, className: "mr-1 text-purple-600" })}
                                      {tool.name}
                                    </div>
                                    {tool.requiresAuth && tool.category === 'google' && (
                                      <div className="text-xs">
                                        {!googleUser ? (
                                          <span 
                                            className="text-orange-500 cursor-pointer hover:underline" 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // When clicked, select this tool and show its configuration
                                              handleToolSelection(node.id, tool);
                                            }}
                                          >
                                            Requires Google Auth
                                          </span>
                                        ) : !connectedServices[tool.service] ? (
                                          <span 
                                            className="text-blue-500 cursor-pointer hover:underline"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // When clicked, select this tool and show its configuration
                                              handleToolSelection(node.id, tool);
                                            }}
                                          >
                                            Click to connect
                                          </span>
                                        ) : (
                                          <span className="text-green-500">Connected</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">{tool.description}</div>
                                  
                                  {/* Show Google service connector if needed */}
                                  {tool.requiresAuth && tool.category === 'google' && googleUser && !isSelected && !connectedServices[tool.service] && (
                                    <div className="mt-2">
                                      <GoogleServiceConnector 
                                        service={tool.service}
                                        isAuthenticated={!!connectedServices[tool.service]}
                                        onConnect={() => handleConnectService(tool.service)}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          
                          <div className="mt-3 flex justify-end">
                            <button 
                              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedToolNodeId(null);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-2 rounded border border-gray-200">
                  <input 
                    type="text" 
                    className="w-full px-2 py-1 bg-transparent border-0 outline-none" 
                    defaultValue={node.content || ''}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const updatedNodes = nodes.map(n => 
                        n.id === node.id ? {...n, content: e.target.value} : n
                      );
                      setNodes(updatedNodes);
                    }}
                  />
                </div>
              )}
              
              {/* Display selected tools if this is a tool node */}
              {node.type === 'tool' && node.tools && node.tools.length > 0 && (
                <div className="mt-2 bg-white p-2 rounded border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Selected Tools:</div>
                  <div className="flex flex-wrap gap-1">
                    {node.tools.map(tool => (
                      <div key={tool.id} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center">
                        <span>{tool.name}</span>
                        <button 
                          className="ml-1 text-purple-600 hover:text-purple-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updatedNodes = nodes.map(n => {
                              if (n.id === node.id) {
                                return {
                                  ...n,
                                  tools: n.tools.filter(t => t.id !== tool.id)
                                };
                              }
                              return n;
                            });
                            setNodes(updatedNodes);
                          }}
                        >
                          <CloseIcon size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Component selector popup */}
      {showComponentSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h2 className="text-xl font-bold mb-4">Add Component</h2>
            <div className="space-y-3">
              <button 
                className="w-full bg-green-100 hover:bg-green-200 text-green-800 p-3 rounded flex items-center"
                onClick={() => addComponent('starter')}
              >
                <Plus size={20} className="mr-2" />
                <span>Starter</span>
              </button>
              
              <button 
                className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 p-3 rounded flex items-center"
                onClick={() => addComponent('prompt')}
              >
                <MessageSquare size={20} className="mr-2" />
                <span>Prompt</span>
              </button>
              
              <button 
                className="w-full bg-purple-100 hover:bg-purple-200 text-purple-800 p-3 rounded flex items-center"
                onClick={() => addComponent('tool')}
              >
                <Wrench size={20} className="mr-2" />
                <span>Tool</span>
              </button>
            </div>
            
            <button 
              className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded"
              onClick={() => setShowComponentSelector(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
