
"use client";

import React, { useState, useEffect } from 'react';
import { useFirestore } from '@/contexts/firestore-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2, Library, ChevronRight, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const CollectionManager: React.FC = () => {
  const { collections, addCollection, removeCollection, selectedCollectionName, setSelectedCollectionName, isConnected } = useFirestore();
  const [newCollectionName, setNewCollectionName] = useState('');
  const [tooltipSide, setTooltipSide] = useState<'left' | 'right' | 'top' | 'bottom'>('right');

  useEffect(() => {
    // Check if window is defined (client-side) before accessing document.body
    if (typeof window !== 'undefined') {
      setTooltipSide(document.body.dir === 'rtl' ? 'left' : 'right');
    }
  }, []);

  const handleAddCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCollectionName.trim()) {
      addCollection(newCollectionName.trim());
      setNewCollectionName('');
    }
  };

  if (!isConnected) {
    return (
      <div className="p-2">
        <p className="text-sm text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">Connect to Firestore to manage collections.</p>
        <Library className="h-8 w-8 text-sidebar-foreground/50 mx-auto mt-4 group-data-[collapsible=icon]:block hidden" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-3 h-full flex flex-col">
        
        <div className="px-1 group-data-[collapsible=icon]:hidden">
          <h3 className="text-xs font-semibold text-sidebar-foreground/80 tracking-wide uppercase">Add Collection</h3>
        </div>

        <form onSubmit={handleAddCollection} className="flex gap-2 px-1 group-data-[collapsible=icon]:px-0 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Collection Path"
                className="flex-grow bg-sidebar-background text-sidebar-foreground focus:bg-background focus:text-[hsl(var(--input-foreground))] group-data-[collapsible=icon]:hidden"
                aria-label="New collection name or path"
              />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="group-data-[collapsible=icon]:hidden">Enter collection path (e.g., users or path/to/subcollection)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
            <Button 
              type="submit" 
              size="icon" 
              aria-label="Add collection" 
              className="bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:rounded-md"
              disabled={!newCollectionName.trim()}
            >
              <PlusCircle className="h-5 w-5" />
            </Button>
            </TooltipTrigger>
            <TooltipContent side={tooltipSide} className="group-data-[collapsible=icon]:block hidden">Add Collection</TooltipContent>
            <TooltipContent side="bottom" className="group-data-[collapsible=icon]:hidden">Add Collection</TooltipContent>
          </Tooltip>

          <div className="group-data-[collapsible=icon]:hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground h-9 w-9"
                  aria-label="Information about listing collections"
                >
                  <Info className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs p-2 shadow-lg rounded-md bg-popover text-popover-foreground">
                Collections are added manually by providing their full path (e.g., 'users' or 'path/to/subcollection').
                Firestore client SDKs do not support listing all collections directly for security and performance reasons.
              </TooltipContent>
            </Tooltip>
          </div>
        </form>

        <div className="px-1 group-data-[collapsible=icon]:hidden">
          <h3 className="text-xs font-semibold text-sidebar-foreground/80 tracking-wide uppercase">Your Collections</h3>
        </div>

        {collections.length === 0 ? (
          <p className="text-sm text-sidebar-foreground/70 px-2 group-data-[collapsible=icon]:hidden">No collections added. Use the form above to add a collection by its path.</p>
        ) : (
          <ScrollArea className="flex-grow pr-1 group-data-[collapsible=icon]:overflow-hidden">
            <ul className="space-y-1">
              {collections.map((collection) => (
                <li key={collection.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        role="button"
                        tabIndex={0}
                        className={cn(
                          buttonVariants({ variant: selectedCollectionName === collection.name ? 'secondary' : 'ghost' }),
                          'w-full justify-between group/item text-sm py-2 px-2 h-auto',
                          'group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center',
                           selectedCollectionName === collection.name 
                             ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90' 
                             : 'hover:bg-sidebar-accent/20 text-sidebar-foreground'
                        )}
                        onClick={() => setSelectedCollectionName(collection.name)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedCollectionName(collection.name); }}
                        aria-current={selectedCollectionName === collection.name ? "page" : undefined}
                      >
                        <span className="flex items-center truncate">
                          <Library className="mr-2 h-5 w-5 flex-shrink-0 group-data-[collapsible=icon]:mr-0" />
                          <span className="truncate group-data-[collapsible=icon]:hidden">{collection.name}</span>
                        </span>
                        <div className="flex items-center group-data-[collapsible=icon]:hidden">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover/item:opacity-100 focus:opacity-100 hover:bg-sidebar-accent/30"
                            onClick={(e) => {
                              e.stopPropagation(); 
                              removeCollection(collection.name);
                            }}
                            aria-label={`Remove ${collection.name} collection`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          {selectedCollectionName === collection.name && <ChevronRight className="h-4 w-4 ml-1 flex-shrink-0" />}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side={tooltipSide}>
                      {collection.name}
                    </TooltipContent>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </div>
    </TooltipProvider>
  );
};

