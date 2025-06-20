
"use client";

import React, { useState, useMemo } from 'react';
import { useFirestore } from '@/contexts/firestore-provider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Brain, Loader2, Info, AlertTriangle, PlusCircle, Pencil, Trash2, Filter, Search, XCircle, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DocumentFormDialog, type DocumentFormData } from './document-form-dialog';
import { BulkImportDialog, type BulkImportFormData } from './bulk-import-dialog'; // Added import
import type { DocumentData } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


const LibraryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>
);

const renderFieldValue = (value: any): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">null</span>;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <span className="font-code text-sm">{value.toString()}</span>;
  }
  if (value.toDate && typeof value.toDate === 'function') { // Firebase Timestamp
    return <span className="font-code text-sm">{value.toDate().toLocaleString()}</span>;
  }
  if (Array.isArray(value) || typeof value === 'object') {
     return <pre className="font-code text-xs bg-muted p-2 rounded-md shadow-inner max-w-md overflow-auto">{JSON.stringify(value, null, 2)}</pre>;
  }
  return <span className="text-muted-foreground italic font-code text-sm">[unsupported_type]</span>;
};


export const DocumentViewer: React.FC = () => {
  const {
    selectedCollectionName,
    documents,
    isFetchingDocuments,
    isConnected,
    currentSummary,
    isSummarizing,
    generateSummaryForCollection,
    error: firestoreError,
    addDocumentToCollection,
    updateDocumentInCollection,
    deleteDocumentFromCollection,
    bulkAddDocumentsToCollection, // Added from context
    isAddingDocument,
    isUpdatingDocument,
    isDeletingDocument,
    isBulkImporting, // Added from context
  } = useFirestore();
  const { toast } = useToast();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false); // State for bulk import dialog
  const [currentDocumentToEdit, setCurrentDocumentToEdit] = useState<{ id: string; data: DocumentData } | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');

  const handleOpenAddModal = () => {
    setFormMode('add');
    setCurrentDocumentToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (doc: { id: string; data: DocumentData }) => {
    setFormMode('edit');
    setCurrentDocumentToEdit(doc);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData: DocumentFormData) => {
    if (!selectedCollectionName) return;

    let parsedData: DocumentData;
    try {
      parsedData = formData.jsonData.trim() === '' ? {} : JSON.parse(formData.jsonData);
    } catch (e) {
      console.error("Invalid JSON data:", e);
      toast({ variant: "destructive", title: "Invalid JSON", description: "The provided data is not valid JSON." });
      return;
    }

    if (formMode === 'add') {
      await addDocumentToCollection(selectedCollectionName, parsedData, formData.documentId || undefined);
    } else if (formMode === 'edit' && currentDocumentToEdit) {
      await updateDocumentInCollection(selectedCollectionName, currentDocumentToEdit.id, parsedData);
    }
    setIsFormModalOpen(false);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!selectedCollectionName) return;
    await deleteDocumentFromCollection(selectedCollectionName, documentId);
  };

  const handleBulkImportSubmit = async (formData: BulkImportFormData) => {
    if (!selectedCollectionName) return;

    let docsToImport: Array<{ id?: string; data: DocumentData }> = [];
    try {
      const parsedJson = JSON.parse(formData.jsonArrayData);
      if (!Array.isArray(parsedJson)) {
        throw new Error("Input must be a JSON array.");
      }
      docsToImport = parsedJson.map(item => {
        if (typeof item !== 'object' || item === null) {
          throw new Error("Each item in the array must be an object.");
        }
        const { id, ...data } = item;
        return { id: typeof id === 'string' ? id : undefined, data };
      });
    } catch (e: any) {
      console.error("Invalid JSON array data for bulk import:", e);
      toast({ variant: "destructive", title: "Invalid JSON for Import", description: e.message || "The provided data is not a valid JSON array of objects." });
      return;
    }

    const result = await bulkAddDocumentsToCollection(selectedCollectionName, docsToImport);
    
    if (result.successCount > 0) {
      toast({ title: "Bulk Import Success", description: `${result.successCount} document(s) imported successfully to ${selectedCollectionName}.` });
    }
    if (result.errorCount > 0) {
      toast({ variant: "destructive", title: "Bulk Import Partially Failed", description: `${result.errorCount} document(s) failed to import. ${result.errors.length > 0 ? `First error: ${result.errors[0]}` : ''}` });
    }
    if (result.successCount === 0 && result.errorCount === 0 && docsToImport.length > 0) {
       toast({ variant: "destructive", title: "Bulk Import Failed", description: "No documents were imported. Please check your JSON and collection permissions." });
    }
    if (docsToImport.length === 0) {
      toast({ title: "Bulk Import", description: "No documents provided in the JSON array." });
    }

    setIsBulkImportModalOpen(false);
  };


  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterField('');
    setFilterValue('');
  };

  const displayedDocuments = useMemo(() => {
    let results = [...documents];

    if (filterField.trim() !== '' && filterValue.trim() !== '') {
      const fieldKey = filterField.trim();
      const valueToMatch = filterValue.trim().toLowerCase();
      results = results.filter(doc => {
        const fieldValue = doc.data[fieldKey];
        if (fieldValue === undefined || fieldValue === null) return false;
        if (typeof fieldValue === 'object') {
          return JSON.stringify(fieldValue).toLowerCase().includes(valueToMatch);
        }
        return String(fieldValue).toLowerCase().includes(valueToMatch);
      });
    }

    if (searchTerm.trim() !== '') {
      const termLower = searchTerm.trim().toLowerCase();
      results = results.filter(doc => {
        if (doc.id.toLowerCase().includes(termLower)) return true;
        for (const key in doc.data) {
          const value = doc.data[key];
          if (value !== undefined && value !== null) {
            if (typeof value === 'object') {
              if (JSON.stringify(value).toLowerCase().includes(termLower)) return true;
            } else {
              if (String(value).toLowerCase().includes(termLower)) return true;
            }
          }
        }
        return false;
      });
    }
    return results;
  }, [documents, filterField, filterValue, searchTerm]);


  if (!isConnected) {
    return (
      <Card className="h-full flex flex-col items-center justify-center shadow-lg border-dashed border-2">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-center text-primary">View Documents</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <Info className="h-16 w-16 text-primary/70 mx-auto mb-4" />
          <p className="text-muted-foreground">Please connect to your Firestore database to view documents.</p>
        </CardContent>
      </Card>
    );
  }

  if (!selectedCollectionName) {
    return (
      <Card className="h-full flex flex-col items-center justify-center shadow-lg border-dashed border-2">
         <CardHeader>
          <CardTitle className="font-headline text-xl text-center text-primary">Select a Collection</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <LibraryIcon className="h-16 w-16 text-primary/70 mx-auto mb-4" />
          <p className="text-muted-foreground">Choose a collection from the sidebar to see its documents.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <Card className="flex-shrink-0 shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex-grow">
              <CardTitle className="font-headline text-2xl text-primary">
                Collection: <span className="font-code text-accent">{selectedCollectionName}</span>
              </CardTitle>
              <CardDescription>
                {isFetchingDocuments && !isAddingDocument ? <Loader2 className="inline h-4 w-4 animate-spin mr-1" /> : null}
                Displaying: {displayedDocuments.length} / Original: {documents.length}
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleOpenAddModal}
                disabled={isAddingDocument || isFetchingDocuments || !!firestoreError || isBulkImporting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[160px] shadow-sm"
                aria-label={`Add document to ${selectedCollectionName} collection`}
              >
                {isAddingDocument ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Add Document
              </Button>
              <Button
                onClick={() => setIsBulkImportModalOpen(true)}
                disabled={isBulkImporting || isFetchingDocuments || !!firestoreError || isAddingDocument}
                variant="outline"
                className="min-w-[160px] shadow-sm"
                aria-label={`Import documents to ${selectedCollectionName} collection`}
              >
                {isBulkImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Import JSON
              </Button>
              <Button 
                onClick={() => generateSummaryForCollection(selectedCollectionName)} 
                disabled={isSummarizing || documents.length === 0 || isFetchingDocuments || !!firestoreError || isAddingDocument || isBulkImporting}
                className="bg-accent hover:bg-accent/90 text-accent-foreground min-w-[160px] shadow-sm"
                aria-label={`Generate summary for ${selectedCollectionName} collection`}
              >
                {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                AI Summary
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {firestoreError && !isFetchingDocuments && (
        <Alert variant="destructive" className="flex-shrink-0 shadow-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Accessing Collection</AlertTitle>
          <AlertDescription>{firestoreError}</AlertDescription>
        </Alert>
      )}

      <Card className="flex-shrink-0 shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center text-primary">
            <Filter className="mr-2 h-5 w-5" /> Filter & Search Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-3">
              <Label htmlFor="search-term" className="sr-only">Search all document content</Label>
              <Input
                id="search-term"
                placeholder="Search all document content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="filter-field" className="text-sm font-medium">Field Name</Label>
              <Input
                id="filter-field"
                placeholder="e.g. category"
                value={filterField}
                onChange={(e) => setFilterField(e.target.value)}
                className="w-full mt-1"
              />
            </div>
            <div>
              <Label htmlFor="filter-value" className="text-sm font-medium">Field Value</Label>
              <Input
                id="filter-value"
                placeholder="e.g. electronics"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                disabled={!filterField.trim()}
                className="w-full mt-1"
              />
            </div>
            <Button onClick={handleClearFilters} variant="outline" className="w-full md:w-auto self-end">
              <XCircle className="mr-2 h-4 w-4" /> Clear
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {(isSummarizing || isBulkImporting) && (
        <Card className="flex-shrink-0 shadow-md">
          <CardContent className="p-6 flex items-center justify-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-primary font-medium">
              {isBulkImporting ? "Importing documents..." : "Generating AI summary, this may take a moment..."}
            </p>
          </CardContent>
        </Card>
      )}

      {currentSummary && !isSummarizing && !isBulkImporting && (
        <Card className="flex-shrink-0 bg-primary/5 border-primary/20 shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center text-primary"><Brain className="mr-2 h-5 w-5" /> AI Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32 p-1">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{currentSummary}</p>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
      
      <Card className="flex-grow overflow-hidden shadow-md">
         <CardHeader className="border-b">
          <CardTitle className="font-headline text-xl flex items-center text-primary"><FileText className="mr-2 h-5 w-5" /> Documents</CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-73px)] p-0">
          <ScrollArea className="h-full">
            {isFetchingDocuments && !isAddingDocument && !isBulkImporting ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-md" />)}
              </div>
            ) : documents.length === 0 && !firestoreError ? (
              <div className="p-6 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                No documents found in this collection.
              </div>
            ) : displayedDocuments.length === 0 && !firestoreError ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  No documents match your current filter or search criteria.
                </div>
            ) : displayedDocuments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] sticky top-0 bg-card z-10">Document ID</TableHead>
                    <TableHead className="sticky top-0 bg-card z-10">Fields</TableHead>
                    <TableHead className="w-[120px] text-right sticky top-0 bg-card z-10">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium font-code align-top text-sm break-all">{doc.id}</TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-2">
                          {Object.entries(doc.data).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-[minmax(120px,max-content)_1fr] gap-x-3 items-start">
                              <strong className="font-medium text-foreground/80 truncate text-sm" title={key}>{key}:</strong>
                              <div>{renderFieldValue(value)}</div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenEditModal(doc)}
                            disabled={isUpdatingDocument[doc.id] || isDeletingDocument[doc.id] || isBulkImporting}
                            aria-label={`Edit document ${doc.id}`}
                          >
                            {isUpdatingDocument[doc.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={isUpdatingDocument[doc.id] || isDeletingDocument[doc.id] || isBulkImporting}
                                aria-label={`Delete document ${doc.id}`}
                              >
                                {isDeletingDocument[doc.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the document
                                  <span className="font-bold font-mono break-all"> {doc.id} </span>
                                  from the collection <span className="font-bold font-mono">{selectedCollectionName}</span>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={isDeletingDocument[doc.id] || isBulkImporting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  disabled={isDeletingDocument[doc.id] || isBulkImporting}
                                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                >
                                  {isDeletingDocument[doc.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null }
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedCollectionName && (
        <DocumentFormDialog
          isOpen={isFormModalOpen}
          onOpenChange={setIsFormModalOpen}
          onSubmit={handleFormSubmit}
          initialData={currentDocumentToEdit ? { documentId: currentDocumentToEdit.id, jsonData: JSON.stringify(currentDocumentToEdit.data, null, 2) } : undefined}
          collectionName={selectedCollectionName}
          isLoading={isAddingDocument || (currentDocumentToEdit ? !!isUpdatingDocument[currentDocumentToEdit.id] : false) || isBulkImporting}
          mode={formMode}
        />
      )}

      {selectedCollectionName && (
        <BulkImportDialog
          isOpen={isBulkImportModalOpen}
          onOpenChange={setIsBulkImportModalOpen}
          onSubmit={handleBulkImportSubmit}
          collectionName={selectedCollectionName}
          isLoading={isBulkImporting}
        />
      )}
    </div>
  );
};
