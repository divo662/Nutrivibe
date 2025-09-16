import React from 'react';
// Removed non-functional notification and settings icons
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';
import MobileNavigation from './MobileNavigation';

const AppHeader: React.FC = () => {
	const { user } = useAuth();
	const { subscription } = useSubscription();

	return (
		<header className="h-16 border-b bg-white px-4 lg:px-6 flex items-center gap-4">
			{/* Mobile Navigation */}
			<MobileNavigation />
			
			{/* Spacer to keep layout balanced */}
			<div className="flex-1 min-w-0" />
			
			{/* Right Side Actions (trimmed) */}
			<div className="flex items-center gap-2 lg:gap-3">
				{/* Plan Info - Hidden on small screens */}
				<div className="text-xs text-muted-foreground hidden sm:block">
					Plan: <span className="font-medium capitalize">{subscription?.plan ?? 'free'}</span>
				</div>
				
				{/* User Avatar */}
				<div className="h-8 w-8 lg:h-8 lg:w-8 rounded-full bg-emerald-600 text-white grid place-items-center text-sm">
					{user?.email?.[0]?.toUpperCase() ?? 'U'}
				</div>
			</div>
		</header>
	);
};

export default AppHeader;


