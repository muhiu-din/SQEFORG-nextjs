"use client";
import React, { useState, useEffect, useRef } from 'react';
import { User, UploadedFile } from '@/api/entities';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Loader2, Upload, File as FileIcon, ClipboardCopy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from "@/components/ui/use-toast"

export default function FileManager() {
  const { toast } = useToast()
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null); // Create a ref for the file input

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        if (currentUser.role === 'admin') {
          await loadFiles();
        }
      } catch (error) {
        setUser(null);
      }
      setLoading(false);
    };
    initialize();
  }, []);

  const loadFiles = async () => {
    const uploadedFiles = await UploadedFile.list('-created_date');
    setFiles(uploadedFiles);
  };

  const handleUpload = async () => {
    const selectedFiles = fileInputRef.current?.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setUploading(true);
    try {
      const filesToCreate = [];
      // Use a standard for loop to iterate through the FileList
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        // CORRECTED: The integration is called with the 'file' object from the input.
        const uploadResult = await base44.integrations.Core.UploadPrivateFile({ file });
        filesToCreate.push({
          file_name: file.name,
          file_uri: uploadResult.file_uri,
          file_type: file.type,
        });
      }

      await UploadedFile.bulkCreate(filesToCreate);
      
      await loadFiles();
      toast({
        title: "Success!",
        description: `${filesToCreate.length} file(s) have been uploaded.`,
      })
      // Reset the file input
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "There was a problem uploading your files.",
      })
    }
    setUploading(false);
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      description: "File URI copied to clipboard!",
    })
  }

  if (loading) {
    return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-slate-600 mt-2">This page is for administrators only.</p>
          <Link to={createPageUrl("Dashboard")}><Button variant="outline" className="mt-6">Return to Dashboard</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">File Manager</h1>
        <p className="text-slate-600 mb-8">Upload and manage your project's source files.</p>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload New Files</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-4">
            <Input type="file" multiple ref={fileInputRef} className="grow" />
            <Button onClick={handleUpload} disabled={uploading} className="w-full sm:w-auto">
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Upload className="w-4 h-4 mr-2" />}
              {uploading ? 'Uploading...' : 'Upload File(s)'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No files uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                    <div className="flex items-center gap-3">
                      <FileIcon className="w-5 h-5 text-slate-500" />
                      <div>
                         <p className="font-medium text-slate-800">{file.file_name}</p>
                         <p className="text-xs text-slate-500">Uploaded on {new Date(file.created_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(file.file_uri)}>
                        <ClipboardCopy className="w-4 h-4 mr-2"/>
                        Copy URI
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}