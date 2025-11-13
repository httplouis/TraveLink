"use client";

import { motion } from 'framer-motion';
import { 
  FileText, 
  UserCheck, 
  Settings, 
  DollarSign, 
  Users, 
  Crown, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  AlertTriangle,
  Paperclip
} from 'lucide-react';
import ProfilePicture from './ProfilePicture';
import { NameWithProfile } from './ProfileHoverCard';
import { formatLongDateTime } from '@/lib/datetime';

interface TimelineEvent {
  id: string;
  type: 'submitted' | 'approved' | 'returned' | 'skipped' | 'edited' | 'acknowledged' | 'dispatched' | 'completed' | 'cancelled';
  title: string;
  description?: string;
  actor: {
    id: string;
    name: string;
    profile_picture?: string;
    department?: string;
    position?: string;
    email?: string;
  };
  timestamp: string;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size?: number;
    url?: string;
  }>;
  metadata?: {
    stage?: string;
    old_value?: string;
    new_value?: string;
    reason?: string;
  };
}

interface TrackingTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export default function TrackingTimeline({ 
  events, 
  className = '' 
}: TrackingTimelineProps) {
  
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'submitted':
        return <FileText className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'returned':
        return <XCircle className="w-4 h-4" />;
      case 'skipped':
        return <Zap className="w-4 h-4" />;
      case 'edited':
        return <Settings className="w-4 h-4" />;
      case 'acknowledged':
        return <UserCheck className="w-4 h-4" />;
      case 'dispatched':
        return <Users className="w-4 h-4" />;
      case 'completed':
        return <Crown className="w-4 h-4" />;
      case 'cancelled':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'submitted':
        return 'bg-blue-500';
      case 'approved':
        return 'bg-green-500';
      case 'returned':
        return 'bg-red-500';
      case 'skipped':
        return 'bg-purple-500';
      case 'edited':
        return 'bg-orange-500';
      case 'acknowledged':
        return 'bg-teal-500';
      case 'dispatched':
        return 'bg-indigo-500';
      case 'completed':
        return 'bg-emerald-600';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatDateTime = (dateString: string) => {
    return formatLongDateTime(dateString);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Request Timeline</h3>
      
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-6">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start space-x-4"
            >
              {/* Event Icon */}
              <div className={`
                relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white
                ${getEventColor(event.type)}
              `}>
                {getEventIcon(event.type)}
              </div>

              {/* Event Content */}
              <div className="flex-1 min-w-0 pb-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    )}
                  </div>
                  <time className="text-sm text-gray-500 ml-4 flex-shrink-0">
                    {formatDateTime(event.timestamp)}
                  </time>
                </div>

                {/* Actor Info */}
                <div className="flex items-center space-x-3 mb-3">
                  <ProfilePicture
                    src={event.actor.profile_picture}
                    name={event.actor.name}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      <NameWithProfile 
                        name={event.actor.name}
                        profile={event.actor}
                      />
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {event.actor.position && event.actor.department 
                        ? `${event.actor.position}, ${event.actor.department}`
                        : event.actor.position || event.actor.department
                      }
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                {event.metadata && (
                  <div className="space-y-2 mb-3">
                    {event.metadata.stage && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Stage:</span> {event.metadata.stage}
                      </p>
                    )}
                    
                    {event.metadata.old_value && event.metadata.new_value && (
                      <div className="text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Changed:</span>
                        </p>
                        <div className="ml-4 space-y-1">
                          <p className="text-red-600">
                            <span className="font-mono">-</span> {event.metadata.old_value}
                          </p>
                          <p className="text-green-600">
                            <span className="font-mono">+</span> {event.metadata.new_value}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {event.metadata.reason && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Reason:</span> {event.metadata.reason}
                      </p>
                    )}
                  </div>
                )}

                {/* Attachments */}
                {event.attachments && event.attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Attachments ({event.attachments.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {event.attachments.map((attachment) => (
                        <motion.a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:border-[#7a0019] hover:bg-red-50 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            <Paperclip className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {attachment.type.toUpperCase()} 
                              {attachment.size && ` • ${formatFileSize(attachment.size)}`}
                            </p>
                          </div>
                        </motion.a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
