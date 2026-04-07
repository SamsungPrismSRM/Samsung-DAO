import { useState, useCallback } from 'react';

const MIRROR_NODE_URL = 'https://testnet.mirrornode.hedera.com';

export interface ProposalEvent {
  proposalId: number;
  proposer: string;
  data: string;
  timestamp: string;
}

export function useMirrorNode() {
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<ProposalEvent[]>([]);

  // Fetch events from Hedera Mirror Node to reconstruct state
  const fetchProposalsFromMirror = useCallback(async (contractAddressEth: string) => {
    setLoading(true);
    try {
      // The topic0 is the Keccak256 hash of the ProposalCreated event signature
      // Event: ProposalCreated(uint256 indexed proposalId, address proposer, string data)
      const topic0 = '0x17c9b0eacfa1f53bb1825b290cbdbafbd7ecf52d0faad7769bfdeed6893dd5b9';
      
      const response = await fetch(`${MIRROR_NODE_URL}/api/v1/contracts/${contractAddressEth}/results/logs?topic0=${topic0}`);
      const data = await response.json();
      
      if (!data.logs) {
        setProposals([]);
        return;
      }
      
      const parsedProposals = data.logs.map((log: any) => {
        // Raw parsing logic mock; use ethers.Interface in production to safely decode log.data and log.topics
        return {
          proposalId: parseInt(log.topics[1], 16),
          proposer: '0x' + log.topics[2].slice(-40),
          data: log.data, // This would be abi-decoded into a JSON string
          timestamp: log.timestamp
        };
      });
      
      setProposals(parsedProposals);
    } catch (err) {
      console.error("Mirror Node fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const getProposalVotes = useCallback(async (contractAddressEth: string, proposalId: number) => {
     // Similarly, fetch VoteCast events
     // Event: VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 weight, string reason)
     const topic0 = '0x49f485db5f40391cb7fedf9c8f6153df7ca8a695afdb9aaee3ce212eabfb6b11';
     const proposalTopic1 = '0x' + proposalId.toString(16).padStart(64, '0');
     
     try {
         const response = await fetch(`${MIRROR_NODE_URL}/api/v1/contracts/${contractAddressEth}/results/logs?topic0=${topic0}&topic1=${proposalTopic1}`);
         const data = await response.json();
         // Process votes to calculate running total
         return data.logs;
     } catch (err) {
         console.error("Mirror Node vote fetch failed", err);
         return [];
     }
  }, []);

  return { fetchProposalsFromMirror, getProposalVotes, proposals, loading };
}
