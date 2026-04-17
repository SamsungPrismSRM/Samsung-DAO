import { useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useProposalStore } from '../stores/useProposalStore';
import { useForumStore } from '../stores/useForumStore';
import { useAuthStore } from '../stores/useAuthStore';

export const DataLoader = () => {
  const socket = useSocket();
  const setProposals = useProposalStore(state => state.setProposals);
  const setPosts = useForumStore(state => state.setPosts);
  const setCategories = useForumStore(state => state.setCategories);
  const login = useAuthStore(state => state.login);

  useEffect(() => {
    // 1. Fetch Initial Data
    const fetchInitialData = async () => {
      try {
        const headers: Record<string, string> = {};
        const token = localStorage.getItem('auth_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const [proposalsRes, forumRes] = await Promise.all([
          fetch('http://localhost:3001/api/v1/data/proposals'),
          fetch('http://localhost:3001/api/v1/data/forum')
        ]);
        
        let userRes: Response | null = null;
        if (token) {
          try {
            userRes = await fetch('http://localhost:3001/api/v1/user/me', { headers });
            if (userRes.status === 401) {
              localStorage.removeItem('auth_token');
            }
          } catch (e) {
            console.warn("Failed to fetch user:", e);
          }
        }

        if (proposalsRes.ok) {
          const text = await proposalsRes.text();
          try {
             const data = JSON.parse(text);
             // Transform DB models to Zustand state format
             const formattedProposals = data.map((p: any) => ({
               id: p.id,
               title: p.title,
               description: p.description,
               type: p.type.toLowerCase(),
               status: p.status.toLowerCase() === 'on_chain_vote' ? 'active' : p.status.toLowerCase(),
               creator: p.creator?.name || 'Unknown',
               creatorAvatar: '',
               createdAt: p.created_at,
               endsAt: p.end_time || p.created_at,
               tags: [], // Could be added in DB schema
               votesFor: p.signaling_votes?.filter((v: any) => v.vote_type === 'YES').reduce((acc: number, v: any) => acc + Number(v.voting_power), 0) || 0,
               votesAgainst: p.signaling_votes?.filter((v: any) => v.vote_type === 'NO').reduce((acc: number, v: any) => acc + Number(v.voting_power), 0) || 0,
               votesAbstain: p.signaling_votes?.filter((v: any) => v.vote_type === 'ABSTAIN').reduce((acc: number, v: any) => acc + Number(v.voting_power), 0) || 0,
               totalVoters: p.signaling_votes?.length || 0,
               participation: 0
             }));
             setProposals(formattedProposals);
          } catch(e) {}
        }
        
        if (forumRes.ok) {
           const data = await forumRes.json();
           const formattedPosts = data.posts.map((p: any) => ({
             id: p.id,
             title: p.title,
             category: 'General',
             tags: p.tags || [],
             author: p.author?.name || 'Unknown',
             authorAvatar: '',
             repliesCount: p._count?.comments || 0,
             lastActivity: p.created_at,
             createdAt: p.created_at,
             content: p.content
           }));
           setPosts(formattedPosts);

           const formattedCategories = data.categories.map((c: any) => ({
             id: c.id,
             title: c.name,
             description: 'Community forum category',
             icon: 'MessageSquare',
             count: c._count?.posts || 0
           }));
           setCategories(formattedCategories);
        }

        if (userRes && userRes.ok) {
           const data = await userRes.json();
           if(data.user) {
             useAuthStore.getState().updateUser(data.user);
           }
        }
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };

    fetchInitialData();
  }, [setProposals, setPosts, login]);

  // 2. Listen to WebSockets
  useEffect(() => {
    if (!socket) return;
    
    // Add missing addProposal to the store if it doesn't exist yet
    const refreshProposals = () => {
      fetch('http://localhost:3001/api/v1/data/proposals')
        .then(res => res.json())
        .then(data => {
             const formattedProposals = data.map((p: any) => ({
               id: p.id,
               title: p.title,
               description: p.description,
               type: p.type.toLowerCase(),
               status: p.status.toLowerCase() === 'on_chain_vote' ? 'active' : p.status.toLowerCase(),
               creator: p.creator?.name || 'Unknown',
               creatorAvatar: '',
               createdAt: p.created_at,
               endsAt: p.end_time || p.created_at,
               tags: [],
               votesFor: p.signaling_votes?.filter((v: any) => v.vote_type === 'YES').reduce((acc: number, v: any) => acc + Number(v.voting_power), 0) || 0,
               votesAgainst: p.signaling_votes?.filter((v: any) => v.vote_type === 'NO').reduce((acc: number, v: any) => acc + Number(v.voting_power), 0) || 0,
               votesAbstain: p.signaling_votes?.filter((v: any) => v.vote_type === 'ABSTAIN').reduce((acc: number, v: any) => acc + Number(v.voting_power), 0) || 0,
               totalVoters: p.signaling_votes?.length || 0,
               participation: 0
             }));
             setProposals(formattedProposals);
        });
    };

    socket.on('proposal_created', refreshProposals);

    socket.on('signaling_vote_cast', refreshProposals);
    socket.on('proposal_updated', refreshProposals);
    socket.on('proposal_executed', refreshProposals);
    
    // Add other event listeners
    
  }, [socket, setProposals]);

  return null; // This component doesn't render anything visually
};
