
"use client";

import React, { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2, InfoIcon, FileJson } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Validator for the JSON content string
const isValidJsonArrayString = (val: string): boolean => {
  if (!val.trim()) return false;
  try {
    const parsed = JSON.parse(val);
    if (!Array.isArray(parsed)) return false;
    // Optionally, check if each item is an object
    // return parsed.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
    return true;
  } catch (e) {
    return false;
  }
};

// Schema for the file input itself
const fileUploadSchema = z.object({
  jsonFile: z
    .custom<FileList>((val) => val instanceof FileList, "File input is required")
    .refine((files) => files.length > 0, "Please select a JSON file.")
    .refine((files) => files.length === 1, "Please select only one file.")
    .refine(
      (files) => files[0]?.type === "application/json",
      "File must be a JSON (.json) file."
    )
    .refine(
      (files) => files[0]?.size <= MAX_FILE_SIZE_BYTES,
      `File size must be less than ${MAX_FILE_SIZE_MB}MB.`
    ),
});
type FileUploadFormData = z.infer<typeof fileUploadSchema>;

// This is the data structure expected by the onSubmit prop (from DocumentViewer)
export interface BulkImportDataFromString {
  jsonArrayData: string;
}

interface BulkImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BulkImportDataFromString) => Promise<void>; // onSubmit prop expects string data
  collectionName: string;
  isLoading?: boolean;
}

export const BulkImportDialog: React.FC<BulkImportDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  collectionName,
  isLoading = false,
}) => {
  const form = useForm<FileUploadFormData>({ // Internal form uses fileUploadSchema
    resolver: zodResolver(fileUploadSchema),
    defaultValues: {
      jsonFile: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(); // Clear file input and errors when dialog opens
    }
  }, [isOpen, form]);

  const handleInternalFormSubmit: SubmitHandler<FileUploadFormData> = async (data) => {
    const file = data.jsonFile[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        try {
          // Validate the content of the file
          if (!isValidJsonArrayString(text)) {
            form.setError("jsonFile", {
              type: "manual",
              message: "File content must be a valid JSON array. Each item can optionally include an 'id' field.",
            });
            return;
          }
          // Call the parent's onSubmit with the string content
          await onSubmit({ jsonArrayData: text });
        } catch (err) {
          form.setError("jsonFile", {
            type: "manual",
            message: "Could not parse file content. Ensure it is valid JSON.",
          });
        }
      };
      reader.onerror = () => {
        form.setError("jsonFile", {
          type: "manual",
          message: "Failed to read the selected file.",
        });
      };
      reader.readAsText(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Bulk Import Documents to <span className="font-mono text-primary">{collectionName}</span>
          </DialogTitle>
          <DialogDescription>
            Select a JSON file containing an array of document objects. Each object will be imported as a new document.
            You can optionally include an <code>"id"</code> field in each object to specify a custom document ID.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleInternalFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="jsonFile"
              render={({ field: { onChange, value, ...restField } }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><FileJson className="mr-2 h-5 w-5 text-primary" /> JSON File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".json,application/json"
                      onChange={(e) => {
                        onChange(e.target.files);
                      }}
                      className="file:text-primary file:font-medium hover:file:text-primary/80"
                      {...restField}
                    />
                  </FormControl>
                  <FormDescription>
                    Select a <code>.json</code> file (max {MAX_FILE_SIZE_MB}MB). Example format: <code>[{`{"field": "value"}`}, {`{"id": "custom", "other": 123}`}]</code>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <Alert variant="default" className="bg-accent/10 border-accent/30">
                <InfoIcon className="h-4 w-4 text-accent" />
                <AlertTitle className="text-accent/90">Note on Document IDs</AlertTitle>
                <AlertDescription className="text-accent/80">
                    If an object in your JSON array includes a top-level <code>"id"</code> field (e.g., <code>{`{"id": "your-custom-id", ...}`}</code>),
                    that value will be used as the document ID. If omitted, Firestore will auto-generate an ID.
                </AlertDescription>
            </Alert>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading || !form.formState.isValid} className="min-w-[100px]">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Import Documents'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Make sure to export BulkImportDataFromString if DocumentViewer or other components need this type
// For now, it's only used internally for the prop type.
// export type { BulkImportDataFromString };

// Renaming the old export to avoid confusion if it was referenced elsewhere,
// though it's unlikely given its previous usage.
// If BulkImportFormData was used externally, this might need adjustment.
// For now, let's assume BulkImportFormData was internal or is now replaced by BulkImportDataFromString for external contracts.
export type BulkImportFormData = BulkImportDataFromString;

