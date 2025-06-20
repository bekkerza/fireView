"use client";

import React, { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectIdFormSchema, type ProjectIdFormData } from '@/config/firebase-config'; // Using the new schema
import { useFirestore } from '@/contexts/firestore-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Power, PowerOff } from 'lucide-react';

export const ConnectForm: React.FC = () => {
  const { connect, disconnect, isConnected, isLoading, error, config: currentFullConfig } = useFirestore();

  const form = useForm<ProjectIdFormData>({
    resolver: zodResolver(projectIdFormSchema),
    defaultValues: {
      projectId: currentFullConfig?.projectId || '',
    },
  });

  useEffect(() => {
    // If there's a current full config, pre-fill the projectId field
    if (currentFullConfig?.projectId) {
      form.reset({ projectId: currentFullConfig.projectId });
    } else {
      form.reset({ projectId: ''}); // Reset to empty if no config or no projectId
    }
  }, [currentFullConfig, form]);

  const onSubmit: SubmitHandler<ProjectIdFormData> = async (data) => {
    // Pass only the projectId to the connect function
    await connect(data.projectId);
  };

  if (isConnected && currentFullConfig) {
    return (
      <Card className="w-full mb-6 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center font-headline text-primary">
            <CheckCircle className="mr-2 h-6 w-6 text-green-500" /> Connected
          </CardTitle>
          <CardDescription>
            Project ID: <span className="font-code text-sm">{currentFullConfig.projectId}</span>
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={disconnect} className="w-full">
            <PowerOff className="mr-2 h-4 w-4" /> Disconnect
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full mb-6 shadow-md">
      <CardHeader>
        <CardTitle className="font-headline text-primary">Connect to Firestore</CardTitle>
        <CardDescription>Enter your Firebase Project ID. Other configurations will be loaded from environment variables.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && !isLoading && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Connection Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project ID</FormLabel>
                  <FormControl>
                    <Input placeholder="my-firebase-project" {...field} className="font-code" aria-required="true" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Removed other Firebase config fields */}
            <Alert variant="default" className="bg-accent/10 border-accent/30">
                <Power className="h-4 w-4 text-accent" />
                <AlertTitle className="text-accent/90">Configuration Note</AlertTitle>
                <AlertDescription className="text-accent/80">
                    API Key, Auth Domain, Storage Bucket, Messaging Sender ID, App ID, and Measurement ID (optional) 
                    should be set in your <code>.env</code> file (e.g., <code>NEXT_PUBLIC_FIREBASE_API_KEY</code>).
                </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Power className="mr-2 h-4 w-4" />
              )}
              Connect
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
