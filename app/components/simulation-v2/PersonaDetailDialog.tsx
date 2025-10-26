'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTTXStoreV2 } from '@/lib/stores/ttxStoreV2';
import { getDemographicLabel } from '@/lib/utils/personaDemographics';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, MapPin, Heart, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

const SENTIMENT_COLORS: Record<string, string> = {
  calm: 'bg-green-500',
  concerned: 'bg-yellow-500',
  anxious: 'bg-orange-500',
  panicked: 'bg-red-500',
  skeptical: 'bg-purple-500',
  defiant: 'bg-pink-500'
};

const LOCATION_COLORS: Record<string, string> = {
  home: 'border-gray-500',
  evacuating: 'border-orange-500',
  shelter: 'border-green-500',
  with_family: 'border-blue-500',
  helping_others: 'border-purple-500'
};

export function PersonaDetailDialog() {
  const scenario = useTTXStoreV2((state) => state.scenario);
  const currentPeriod = useTTXStoreV2((state) => state.currentPeriod);
  const selectedPersonaId = useTTXStoreV2((state) => state.selectedPersonaId);
  const setSelectedPersona = useTTXStoreV2((state) => state.setSelectedPersona);
  const getPersonaHistory = useTTXStoreV2((state) => state.getPersonaHistory);

  if (!scenario || !selectedPersonaId) return null;

  const currentResult = scenario.periodResults[currentPeriod - 1];
  const persona = currentResult.personaResponses.find(p => p.personaId === selectedPersonaId);

  if (!persona) return null;

  const history = getPersonaHistory(selectedPersonaId);

  return (
    <Dialog open={!!selectedPersonaId} onOpenChange={(open) => !open && setSelectedPersona(null)}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <User className="h-5 w-5" />
            {persona.personaName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4">
          <div className="space-y-4 pb-4">
            {/* Current Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Current Status - Period {currentPeriod}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${SENTIMENT_COLORS[persona.sentiment]} text-white`}>
                    {persona.sentiment}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {persona.decision.replace('_', ' ')}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {persona.location.replace('_', ' ')}
                  </Badge>
                  {persona.needsAssistance && (
                    <Badge variant="destructive">Needs Assistance</Badge>
                  )}
                </div>

                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium mb-1">Reasoning:</p>
                  <p className="text-sm text-muted-foreground">{persona.reasoning}</p>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Bio */}
            {persona.bio && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Background
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {persona.bio}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Demographics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: persona.bio ? 0.3 : 0.2 }}
            >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Demographics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2 font-medium">{persona.personaType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Age:</span>
                    <span className="ml-2 font-medium">{persona.demographics.age}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Race:</span>
                    <span className="ml-2 font-medium capitalize">{persona.demographics.race}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Income:</span>
                    <span className="ml-2 font-medium">{getDemographicLabel('socialStatus', persona.demographics.socialStatus)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Education:</span>
                    <span className="ml-2 font-medium">{getDemographicLabel('educationLevel', persona.demographics.educationLevel)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trust in Gov:</span>
                    <span className="ml-2 font-medium">{getDemographicLabel('trustInGovernment', persona.demographics.trustInGovernment)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Political:</span>
                    <span className="ml-2 font-medium capitalize">{persona.demographics.politicalLeaning}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Household:</span>
                    <span className="ml-2 font-medium">{persona.demographics.householdSize} people</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Children:</span>
                    <span className="ml-2 font-medium">{persona.demographics.hasChildren ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vehicle:</span>
                    <span className="ml-2 font-medium">{persona.demographics.hasVehicle ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Housing:</span>
                    <span className="ml-2 font-medium">{getDemographicLabel('homeOwnership', persona.demographics.homeOwnership)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Actions Taken */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: persona.bio ? 0.4 : 0.3 }}
            >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Actions Taken
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {persona.actions.map((action, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-muted-foreground mt-1">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            </motion.div>

            {/* Concerns */}
            {persona.concerns.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: persona.bio ? 0.5 : 0.4 }}
              >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Concerns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {persona.concerns.map((concern, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              </motion.div>
            )}

            {/* History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: persona.bio ? 0.6 : 0.5 }}
            >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Decision History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.map((periodPersona, i) => {
                    const period = i + 1;
                    const isCurrentPeriod = period === currentPeriod;

                    return (
                      <div
                        key={period}
                        className={`p-2 rounded border ${isCurrentPeriod ? 'border-primary bg-primary/5' : 'border-border'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold">
                            Period {period} {isCurrentPeriod && '(Current)'}
                          </span>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${SENTIMENT_COLORS[periodPersona.sentiment]} text-white`}
                            >
                              {periodPersona.sentiment}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {periodPersona.location.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                          "{periodPersona.reasoning.slice(0, 150)}{periodPersona.reasoning.length > 150 ? '...' : ''}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
