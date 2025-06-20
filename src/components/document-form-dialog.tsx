
"use client";

import React, { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from 'lucide-react';

const isValidJsonString = (val: string): boolean => {
  if (!val.trim()) return true; // Allow empty string for new docs, can be handled as empty object
  try {
    JSON.parse(val);
    return true;
  } catch (e) {
    return false;
  }
};

const documentFormSchema = z.object({
  documentId: z.string().optional(),
  jsonData: z.string().refine(isValidJsonString, {
    message: "Data must be a valid JSON string or empty.",
  }),
});

export type DocumentFormData = z.infer<typeof documentFormSchema>;

interface DocumentFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DocumentFormData) => Promise<void>;
  initialData?: { documentId?: string; jsonData?: string };
  collectionName: string;
  isLoading?: boolean;
  mode: 'add' | 'edit';
}

export const DocumentFormDialog: React.FC<DocumentFormDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  collectionName,
  isLoading = false,
  mode,
}) => {
  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      documentId: initialData?.documentId || '',
      jsonData: initialData?.jsonData || '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        documentId: initialData?.documentId || '',
        jsonData: initialData?.jsonData || (mode === 'add' ? '{\n  "field": "value"\n}' : ''),
      });
    }
  }, [isOpen, initialData, form, mode]);

  const handleFormSubmit: SubmitHandler<DocumentFormData> = async (data) => {
    await onSubmit(data);
    // form.reset(); // Keep dialog open for user to see success/error, close handled by onOpenChange
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Document' : 'Edit Document'} to <span className="font-mono text-primary">{collectionName}</span>
          </DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Enter an optional Document ID (auto-generated if blank) and the document data as a JSON string.' : `Editing document with ID: ${initialData?.documentId}. Modify the JSON data below.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            {mode === 'add' && (
              <FormField
                control={form.control}
                name="documentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Leave blank to auto-generate" {...field} className="font-mono" />
                    </FormControl>
                    <FormDescription>If you provide an ID, it must be unique within the collection.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {mode === 'edit' && initialData?.documentId && (
                 <FormItem>
                    <FormLabel>Document ID</FormLabel>
                    <FormControl>
                        <Input value={initialData.documentId} readOnly disabled className="font-mono bg-muted"/>
                    </FormControl>
                 </FormItem>
            )}
            <FormField
              control={form.control}
              name="jsonData"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Data (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{ "fieldName": "fieldValue", "nested": { "key": 123 } }'
                      {...field}
                      className="font-mono min-h-[200px] text-sm"
                      rows={10}
                    />
                  </FormControl>
                  <FormDescription>Enter the document content as a valid JSON string.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading} className="min-w-[100px]">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (mode === 'add' ? 'Add' : 'Save Changes')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
