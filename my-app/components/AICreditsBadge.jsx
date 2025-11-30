"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';

export default function AICreditsBadge({ className = "" }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
            } catch (e) {
                setUser(null);
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    if (loading) {
        return (
            <Badge variant="outline" className={`${className} bg-purple-50 border-purple-200`}>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Loading...
            </Badge>
        );
    }

    const credits = user?.ai_credits || 0;
    const isLow = credits < 100;
    const isZero = credits === 0;

    return (
        <Badge 
            variant="outline" 
            className={`${className} ${
                isZero ? 'bg-red-50 border-red-300 text-red-700' :
                isLow ? 'bg-amber-50 border-amber-300 text-amber-700' :
                'bg-purple-50 border-purple-300 text-purple-700'
            }`}
        >
            <Sparkles className="w-3 h-3 mr-1" />
            {credits.toLocaleString()} AI Credits
        </Badge>
    );
}