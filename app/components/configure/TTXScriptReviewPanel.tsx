// This file has been removed as part of the cleanup process.
import { saveLatestEmergencyPlan } from '@/lib/utils/browserStorage';

interface TTXScriptReviewPanelProps {
  script: {
    scenarioType: string;
    location: string;
    severity: string;
    population: number;
    periods: (OperationalPeriod & {
      injects: Inject[];
      eocActions: EOCAction[];
    })[];
  };
  onSubmit: () => void;
  isSubmitting?: boolean;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500'
};

const PHASE_COLORS: Record<string, string> = {
  planning: 'bg-blue-500',
  preparation: 'bg-yellow-500',
  response: 'bg-red-500',
  recovery: 'bg-green-500'
};

export function TTXScriptReviewPanel({ script, onSubmit, isSubmitting = false }: TTXScriptReviewPanelProps) {
  const [editingInject, setEditingInject] = useState<Inject | null>(null);
  const [editingAction, setEditingAction] = useState<EOCAction | null>(null);

  const handleSaveAndSubmit = () => {
    try {
      const plan = toEmergencyPlan(script as any);
      saveLatestEmergencyPlan(plan);
    } catch (e) {
      console.error('Failed to persist plan to browser storage:', e);
    }
    onSubmit();
  };

  const handleExport = () => {
    try {
      const plan = toEmergencyPlan(script as any);
      const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'emergency_plan.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export plan JSON:', e);
    }
  };

  const handleEditInject = (inject: Inject) => {
    setEditingInject({ ...inject });
  };

  const handleEditAction = (action: EOCAction) => {
    setEditingAction({ ...action });
  };

  const totalInjects = script.periods.reduce((sum, p) => sum + p.injects.length, 0);
  const totalActions = script.periods.reduce((sum, p) => sum + p.eocActions.length, 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>TTX Script Review</CardTitle>
          <CardDescription>
            Review the generated script. You can edit individual injects and EOC actions before submitting to the backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Scenario Summary */}
          <div className="mb-6 p-4 bg-accent/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg capitalize">{script.scenarioType} Scenario</h3>
              <Badge className="capitalize">{script.severity}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{script.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{script.population.toLocaleString()} population</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm pt-2 border-t">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{script.periods.length} Operational Periods</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span>{totalInjects} Injects</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span>{totalActions} EOC Actions</span>
              </div>
            </div>
          </div>

          {/* Periods */}
          <ScrollArea className="h-[500px] pr-4">
            <Accordion type="multiple" defaultValue={['op-1', 'op-2', 'op-3']} className="space-y-2">
              {script.periods.map((period) => (
                <AccordionItem key={period.id} value={period.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge className={`${PHASE_COLORS[period.phase]} text-white`}>
                        {(period as any).startTime}
                      </Badge>
                      {/* <span className="font-medium">{period.label}</span>
                      {((period as any).startTime || (period as any).endTime) && (
                        <span className="text-xs text-muted-foreground">{(period as any).startTime || ''} {(period as any).endTime ? `→ ${(period as any).endTime}` : ''}</span>
                      )} */}
                      <Badge variant="outline" className="capitalize">{period.phase}</Badge>
                      <div className="flex items-center gap-2 ml-auto mr-2">
                        <Badge variant="secondary">{period.injects.length} injects</Badge>
                        <Badge variant="secondary">{period.eocActions.length} actions</Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    {/* Injects */}
                    {period.injects.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Injects
                        </h4>
                        <div className="space-y-2">
                          {period.injects.map((inject) => (
                            <div
                              key={inject.id}
                              className="p-3 border rounded-lg bg-background hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      {inject.time}
                                    </Badge>
                                    <Badge className={`${SEVERITY_COLORS[inject.severity]} text-white text-xs`}>
                                      {inject.severity}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs capitalize">
                                      {inject.type.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <h5 className="font-medium text-sm">{inject.title}</h5>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditInject(inject)}
                                  className="ml-2"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground">{inject.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* EOC Actions */}
                    {period.eocActions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          EOC Actions
                        </h4>
                        <div className="space-y-2">
                          {period.eocActions.map((action) => (
                            <div
                              key={action.id}
                              className="p-3 border rounded-lg bg-accent/20 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      {action.time}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs capitalize">
                                      {action.actionType.replace('_', ' ')}
                                    </Badge>
                                    {action.actionType === 'evacuation_order' && (
                                      <>
                                        <Badge className={action.urgency === 'mandatory' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'} >
                                          {action.urgency}
                                        </Badge>
                                        {action.zone && <Badge variant="outline">{action.zone}</Badge>}
                                      </>
                                    )}
                                  </div>
                                  <p className="text-sm">{action.details}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Target: {action.targetPopulation}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditAction(action)}
                                  className="ml-2"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>

          {/* Export & Submit Buttons */}
          <div className="mt-6 pt-6 border-t flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                onClick={handleSaveAndSubmit}
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting to Backend...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit to Backend & Generate Simulation
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Inject Dialog */}
      <Dialog open={!!editingInject} onOpenChange={(open) => !open && setEditingInject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inject</DialogTitle>
            <DialogDescription>
              Modify the inject details below. Changes will be reflected in the final script.
            </DialogDescription>
          </DialogHeader>
          {editingInject && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editingInject.title}
                  onChange={(e) => setEditingInject({ ...editingInject, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingInject.description}
                  onChange={(e) => setEditingInject({ ...editingInject, description: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingInject(null)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // TODO: Update the inject in the script
              setEditingInject(null);
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Action Dialog */}
      <Dialog open={!!editingAction} onOpenChange={(open) => !open && setEditingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit EOC Action</DialogTitle>
            <DialogDescription>
              Modify the EOC action details below. Changes will be reflected in the final script.
            </DialogDescription>
          </DialogHeader>
          {editingAction && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Details</label>
                <Textarea
                  value={editingAction.details}
                  onChange={(e) => setEditingAction({ ...editingAction, details: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Target Population</label>
                <Input
                  value={editingAction.targetPopulation}
                  onChange={(e) => setEditingAction({ ...editingAction, targetPopulation: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAction(null)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // TODO: Update the action in the script
              setEditingAction(null);
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
