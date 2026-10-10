'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stepper } from '@/components/ui/stepper';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FileDropzone } from '@/components/ui/file-dropzone';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api-client';
import { EVIDENCE_CATEGORIES, PHOTO_SLOT_GUIDANCE } from '@/lib/constants';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const STEPS = ['Vehicle Details', 'Photo Evidence', 'Site Questionnaire', 'Review & Submit'];

export default function NewRequestWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [vehicle, setVehicle] = useState({
    manufacturer: '',
    model: '',
    charger_power_kw: '',
  });

  const [photos, setPhotos] = useState<Record<string, File | null>>({
    [EVIDENCE_CATEGORIES.CHARGER_LABEL]: null,
    [EVIDENCE_CATEGORIES.PARKING_LOCATION]: null,
    [EVIDENCE_CATEGORIES.NEAREST_SOCKET]: null,
  });

  const [questionnaire, setQuestionnaire] = useState({
    socket_circuit_rating: '',
    dedicated_or_shared: 'unknown',
    earthing: 'unknown',
    indoor_outdoor: 'indoor',
    cable_route: '',
    parking_details: '',
  });

  const handleNext = () => {
    // Validation for step 1
    if (currentStep === 0 && (!vehicle.manufacturer || !vehicle.model || !vehicle.charger_power_kw)) {
      toast({ type: 'error', title: 'Missing Information', message: 'Please fill in all vehicle details.' });
      return;
    }
    // Validation for step 2
    if (currentStep === 1) {
      if (!photos[EVIDENCE_CATEGORIES.CHARGER_LABEL] || !photos[EVIDENCE_CATEGORIES.PARKING_LOCATION] || !photos[EVIDENCE_CATEGORIES.NEAREST_SOCKET]) {
        toast({ type: 'error', title: 'Missing Photos', message: 'Please upload all required photos.' });
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const uploadPhoto = async (file: File, requestId: string, category: string) => {
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const fileName = `${requestId}/${category}-${Date.now()}.${ext}`;
    
    const { data, error } = await supabase.storage
      .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'chargenoc-evidence')
      .upload(fileName, file);
      
    if (error) throw error;
    
    // Tell backend about the uploaded file
    await api.post(`/api/v1/requests/${requestId}/evidence/`, {
      category,
      file_key: data.path,
      file_type: file.type,
      file_size_bytes: file.size,
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create Vehicle
      const newVehicle = await api.createVehicle({
        manufacturer: vehicle.manufacturer,
        model: vehicle.model,
        charger_power_kw: parseFloat(vehicle.charger_power_kw),
      });

      // 2. Create Request (Draft)
      const req = await api.createRequest({
        vehicle_id: newVehicle.id,
        site_questionnaire: questionnaire as any,
      });

      // 3. Upload Photos to Supabase and register with backend
      await Promise.all([
        uploadPhoto(photos[EVIDENCE_CATEGORIES.CHARGER_LABEL]!, req.id, EVIDENCE_CATEGORIES.CHARGER_LABEL),
        uploadPhoto(photos[EVIDENCE_CATEGORIES.PARKING_LOCATION]!, req.id, EVIDENCE_CATEGORIES.PARKING_LOCATION),
        uploadPhoto(photos[EVIDENCE_CATEGORIES.NEAREST_SOCKET]!, req.id, EVIDENCE_CATEGORIES.NEAREST_SOCKET),
      ]);

      // 4. Submit Request
      await api.submitRequest(req.id);
      
      // 5. Trigger Photo Check automatically
      await api.triggerPhotoCheck(req.id);

      toast({ type: 'success', title: 'Request Submitted!', message: 'Your charging request has been sent for Photo Check.' });
      queryClient.invalidateQueries({ queryKey: ['owner-overview'] });
      router.push('/dashboard/owner/tracker');
    } catch (e: unknown) {
      toast({ type: 'error', title: 'Submission failed', message: (e as any).message || 'Something went wrong.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text-primary">New Charging Request</h1>
        <p className="text-text-muted mt-1">Submit your EV charging installation details for RWA approval.</p>
      </div>

      <Stepper steps={STEPS} currentStep={currentStep} />

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Input 
                label="Vehicle Manufacturer" 
                placeholder="e.g. Tata Motors" 
                value={vehicle.manufacturer}
                onChange={(e) => setVehicle(prev => ({ ...prev, manufacturer: e.target.value }))}
              />
              <Input 
                label="Vehicle Model" 
                placeholder="e.g. Nexon EV" 
                value={vehicle.model}
                onChange={(e) => setVehicle(prev => ({ ...prev, model: e.target.value }))}
              />
              <Input 
                label="Charger Power (kW)" 
                type="number" 
                step="0.1" 
                placeholder="e.g. 7.2" 
                value={vehicle.charger_power_kw}
                onChange={(e) => setVehicle(prev => ({ ...prev, charger_power_kw: e.target.value }))}
              />
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-8">
              <FileDropzone 
                label="1. Charger Label"
                description={PHOTO_SLOT_GUIDANCE[EVIDENCE_CATEGORIES.CHARGER_LABEL]}
                selectedFile={photos[EVIDENCE_CATEGORIES.CHARGER_LABEL]}
                onFileSelect={(file) => setPhotos(prev => ({ ...prev, [EVIDENCE_CATEGORIES.CHARGER_LABEL]: file }))}
                onClear={() => setPhotos(prev => ({ ...prev, [EVIDENCE_CATEGORIES.CHARGER_LABEL]: null }))}
              />
              <FileDropzone 
                label="2. Parking Location"
                description={PHOTO_SLOT_GUIDANCE[EVIDENCE_CATEGORIES.PARKING_LOCATION]}
                selectedFile={photos[EVIDENCE_CATEGORIES.PARKING_LOCATION]}
                onFileSelect={(file) => setPhotos(prev => ({ ...prev, [EVIDENCE_CATEGORIES.PARKING_LOCATION]: file }))}
                onClear={() => setPhotos(prev => ({ ...prev, [EVIDENCE_CATEGORIES.PARKING_LOCATION]: null }))}
              />
              <FileDropzone 
                label="3. Nearest Socket/Board"
                description={PHOTO_SLOT_GUIDANCE[EVIDENCE_CATEGORIES.NEAREST_SOCKET]}
                selectedFile={photos[EVIDENCE_CATEGORIES.NEAREST_SOCKET]}
                onFileSelect={(file) => setPhotos(prev => ({ ...prev, [EVIDENCE_CATEGORIES.NEAREST_SOCKET]: file }))}
                onClear={() => setPhotos(prev => ({ ...prev, [EVIDENCE_CATEGORIES.NEAREST_SOCKET]: null }))}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Input 
                label="Declared Socket Rating (Amps)" 
                placeholder="e.g. 15A" 
                value={questionnaire.socket_circuit_rating}
                onChange={(e) => setQuestionnaire(prev => ({ ...prev, socket_circuit_rating: e.target.value }))}
              />
              <Select 
                label="Circuit Type" 
                options={[
                  { value: 'unknown', label: 'Unknown' },
                  { value: 'dedicated', label: 'Dedicated' },
                  { value: 'shared', label: 'Shared' }
                ]}
                value={questionnaire.dedicated_or_shared}
                onChange={(e) => setQuestionnaire(prev => ({ ...prev, dedicated_or_shared: e.target.value }))}
              />
              <Select 
                label="Earthing Status" 
                options={[
                  { value: 'unknown', label: 'Unknown' },
                  { value: 'known', label: 'Known Present' },
                  { value: 'absent', label: 'Absent' }
                ]}
                value={questionnaire.earthing}
                onChange={(e) => setQuestionnaire(prev => ({ ...prev, earthing: e.target.value }))}
              />
              <Select 
                label="Installation Location" 
                options={[
                  { value: 'indoor', label: 'Indoor (Basement)' },
                  { value: 'outdoor', label: 'Outdoor (Open)' }
                ]}
                value={questionnaire.indoor_outdoor}
                onChange={(e) => setQuestionnaire(prev => ({ ...prev, indoor_outdoor: e.target.value }))}
              />
              <div className="sm:col-span-2">
                <Input 
                  label="Cable Route Description" 
                  placeholder="e.g. From meter board on GF to basement parking 12" 
                  value={questionnaire.cable_route}
                  onChange={(e) => setQuestionnaire(prev => ({ ...prev, cable_route: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2 text-xs text-text-muted mt-2 p-3 bg-surface border border-cn-border rounded">
                <span className="font-semibold text-text-primary">Note:</span> These details are declared by you. They will be verified by the AI and/or an electrician.
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-surface border border-cn-border rounded-lg">
                <h4 className="font-semibold mb-2">Vehicle</h4>
                <p className="text-sm text-text-muted">{vehicle.manufacturer} {vehicle.model} ({vehicle.charger_power_kw} kW)</p>
              </div>
              <div className="p-4 bg-surface border border-cn-border rounded-lg">
                <h4 className="font-semibold mb-2">Photos Uploaded</h4>
                <p className="text-sm text-text-muted">3/3 required photos attached.</p>
              </div>
              <div className="p-4 bg-surface border border-cn-border rounded-lg">
                <h4 className="font-semibold mb-2">Site Details</h4>
                <p className="text-sm text-text-muted">Declared Location: {questionnaire.indoor_outdoor}</p>
                <p className="text-sm text-text-muted">Earthing: {questionnaire.earthing}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t border-cn-border pt-6">
          <Button variant="secondary" onClick={handleBack} disabled={currentStep === 0 || isSubmitting}>
            Back
          </Button>
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext}>Next Step</Button>
          ) : (
            <Button onClick={handleSubmit} loading={isSubmitting}>Submit Request</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
