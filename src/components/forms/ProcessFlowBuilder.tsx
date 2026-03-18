import React from 'react';
import { motion } from 'framer-motion';
import { RiArrowDownLine } from 'react-icons/ri';

interface ProcessNode {
  id: string;
  type: 'start' | 'node' | 'end';
  name: string;
  executor?: string;
  settings: Record<string, any>;
}

interface ProcessFlowBuilderProps {
  nodes: ProcessNode[];
  selectedNodeId: string | null;
  onSelectNode: (node: ProcessNode) => void;
  theme?: 'default' | 'light';
}

const ProcessFlowBuilder: React.FC<ProcessFlowBuilderProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  theme = 'default'
}) => {
  const isLightTheme = theme === 'light';

  const getNodeColor = (type: string) => {
    if (isLightTheme) {
      switch (type) {
        case 'start':
          return 'bg-[#fff7df] border-[#f2cd6f] text-[#6a3a0f]';
        case 'end':
          return 'bg-[#fff1c8] border-[#d7a235] text-[#5a2f0f]';
        default:
          return 'bg-[#fff4d4] border-[#e6b451] text-[#5f3812]';
      }
    }

    switch (type) {
      case 'start':
        return 'bg-ai-teal/20 border-ai-teal text-ai-teal';
      case 'end':
        return 'bg-accent-500/20 border-accent-500 text-accent-500';
      default:
        return 'bg-ai-blue/20 border-ai-blue text-ai-blue';
    }
  };
  
  return (
    <div className="py-2">
      <div className="flex flex-col items-center">
        {nodes.map((node, index) => (
          <React.Fragment key={node.id}>
            <motion.div
              whileHover={{ scale: 1.03 }}
              className={`w-full max-w-sm rounded-lg p-3 border-2 cursor-pointer transition-colors ${
                selectedNodeId === node.id
                  ? isLightTheme
                    ? 'ring-2 ring-offset-2 ring-offset-[#fff7df] ring-[#d7a235]'
                    : 'ring-2 ring-offset-2 ring-offset-dark-900 ring-ai-blue'
                  : ''
              } ${getNodeColor(node.type)}`}
              onClick={() => onSelectNode(node)}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{node.name}</div>
                <div className={`text-xs px-2 py-1 rounded-full ${isLightTheme ? 'bg-[#f2cd6f]/35 text-[#6a3a0f]' : 'bg-dark-800/50'}`}>
                  {node.type === 'start' ? 'Start' : node.type === 'end' ? 'End' : 'Process'}
                </div>
              </div>
              
              {node.type === 'node' && (
                <div className="mt-1 text-sm opacity-80">
                  {node.executor ? `Executor: ${node.executor}` : 'No executor assigned'}
                </div>
              )}
            </motion.div>
            
            {/* Connector line between nodes */}
            {index < nodes.length - 1 && (
              <div className={`w-px h-10 flex justify-center items-center my-1 ${isLightTheme ? 'bg-[#d7a235]' : 'bg-gray-600'}`}>
                <div className={`rounded-full p-1 ${isLightTheme ? 'bg-[#fff4d4]' : 'bg-dark-800'}`}>
                  <RiArrowDownLine className={isLightTheme ? 'text-[#8a4b14]' : 'text-gray-400'} />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProcessFlowBuilder; 
