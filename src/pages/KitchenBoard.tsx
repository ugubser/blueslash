import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Edit,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  Paperclip,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import MarkdownToolbar from '../components/MarkdownToolbar';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { useToast } from '../hooks/useToast';
import { formatDateTime } from '../utils/formatting';
import type {
  DirectMessage,
  KitchenPost,
} from '../types';
import {
  deleteKitchenPost,
  markMessageAsRead,
  sendDirectMessage,
  subscribeToDirectMessages,
  subscribeToKitchenPosts,
  upsertKitchenPost,
} from '../services/kitchen';
import { useLocation, useNavigate } from 'react-router-dom';

interface PostComposerState {
  body: string;
  attachment?: File | null;
  attachmentPreview?: string | null;
  editingPost?: KitchenPost | null;
}

interface PostModalState {
  post: KitchenPost;
  isEditing: boolean;
}

const KitchenBoard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { household, members } = useHousehold();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<KitchenPost[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostModalState | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [postPendingDelete, setPostPendingDelete] = useState<KitchenPost | null>(null);
  const [composerState, setComposerState] = useState<PostComposerState>({ body: '' });
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [messageRecipient, setMessageRecipient] = useState<string>('');
  const [messageGems, setMessageGems] = useState<number>(0);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pendingPostId, setPendingPostId] = useState<string | null>(null);
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!household?.id) return;

    const unsub = subscribeToKitchenPosts(household.id, (data) => {
      setPosts(data);
    });

    return () => {
      unsub();
    };
  }, [household?.id]);

  useEffect(() => {
    if (!household?.id || !user?.id) return;

    const unsub = subscribeToDirectMessages({
      householdId: household.id,
      userId: user.id,
      onMessages: (data) => setMessages(data),
    });

    return () => {
      unsub();
    };
  }, [household?.id, user?.id]);

  useEffect(() => {
    if (!user?.id || !members.length) return;
    const initialRecipient = members.find((member) => member.id !== user.id)?.id;
    if (initialRecipient) {
      setMessageRecipient(initialRecipient);
    }
  }, [members, user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const postId = params.get('postId');
    const messageId = params.get('messageId');

    if (postId) {
      setPendingPostId(postId);
    }

    if (messageId) {
      setPendingMessageId(messageId);
    }

    if (postId || messageId) {
      navigate('/kitchen-board', { replace: true });
    }
  }, [location.search, navigate]);

  const resetComposer = () => {
    if (composerState.attachmentPreview) {
      URL.revokeObjectURL(composerState.attachmentPreview);
    }
    setComposerState({ body: '' });
    setIsComposerOpen(false);
  };

  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setComposerState((prev) => {
      if (prev.attachmentPreview) {
        URL.revokeObjectURL(prev.attachmentPreview);
      }

      if (!file) {
        return { ...prev, attachment: undefined, attachmentPreview: undefined };
      }

      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      return {
        ...prev,
        attachment: file,
        attachmentPreview: preview,
      };
    });
  };

  useEffect(() => {
    return () => {
      if (composerState.attachmentPreview) {
        URL.revokeObjectURL(composerState.attachmentPreview);
      }
    };
  }, [composerState.attachmentPreview]);

  const canEditPost = (post: KitchenPost) => {
    if (!user || !household) return false;
    return post.authorId === user.id || household.headOfHousehold === user.id;
  };

  const handleSavePost = async () => {
    if (!user || !household) return;
    if (!composerState.body.trim()) {
      return;
    }

    try {
      setIsSavingPost(true);
      const post = composerState.editingPost;

      await upsertKitchenPost({
        householdId: household.id,
        authorId: user.id,
        authorName: user.displayName,
        body: composerState.body,
        attachmentFile: composerState.attachment ?? undefined,
        existingPosts: posts,
        postId: post?.id,
        currentAttachment: post?.attachment,
      });

      resetComposer();
    } catch (error) {
      console.error('Failed to save kitchen post:', error);
      showToast('Failed to save post. Please try again.', 'error');
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleEditPost = (post: KitchenPost) => {
    setComposerState({
      body: post.body,
      editingPost: post,
      attachment: undefined,
      attachmentPreview: undefined,
    });
    setIsComposerOpen(true);
  };

  const handleConfirmDelete = (post: KitchenPost) => {
    setPostPendingDelete(post);
    setIsConfirmDeleteOpen(true);
  };

  const executeDeletePost = async () => {
    if (!postPendingDelete) return;
    try {
      await deleteKitchenPost(postPendingDelete);
      setSelectedPost(null);
      setPostPendingDelete(null);
      setIsConfirmDeleteOpen(false);
    } catch (error) {
      console.error('Failed to delete post:', error);
      showToast('Failed to delete post. Please try again.', 'error');
    }
  };

  const getMemberName = (userId: string): string => {
    return members.find((member) => member.id === userId)?.displayName || 'Unknown';
  };

  const orderedMessages = useMemo(() => {
    return [...messages].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [messages]);

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    return orderedMessages.filter((message) => message.recipientId === user.id && !message.readAt).length;
  }, [orderedMessages, user]);

  const handleSendMessage = async () => {
    if (!user || !household) return;
    if (!messageRecipient) {
      showToast('Select a household member to send a message.', 'warning');
      return;
    }

    if (!messageBody.trim()) {
      showToast('Message cannot be empty', 'warning');
      return;
    }

    try {
      setSendingMessage(true);
      const response = await sendDirectMessage({
        householdId: household.id,
        senderId: user.id,
        recipientId: messageRecipient,
        body: messageBody,
        gems: messageGems,
      });

      if (!response.success) {
        throw new Error(response.error || 'Unknown error');
      }

      if (messageGems > 0) {
        await refreshUser();
      }

      setMessageBody('');
      setMessageGems(0);
    } catch (error) {
      console.error('Failed to send message:', error);
      showToast('Failed to send message. Please try again.', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const openPostModal = (post: KitchenPost) => {
    setSelectedPost({ post, isEditing: false });
  };

  const closePostModal = () => {
    setSelectedPost(null);
  };

  const handleEditWithinModal = () => {
    if (!selectedPost) return;
    handleEditPost(selectedPost.post);
    closePostModal();
  };

  const handleMarkMessageRead = async (message: DirectMessage) => {
    if (!user || message.recipientId !== user.id || message.readAt) return;
    try {
      await markMessageAsRead(message.id);
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const fridgePosts = useMemo(() => posts, [posts]);
  const listPosts = useMemo(
    () => [...posts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [posts],
  );

  useEffect(() => {
    if (!pendingPostId) return;
    const target = posts.find((post) => post.id === pendingPostId);
    if (target) {
      openPostModal(target);
      setPendingPostId(null);
    }
  }, [pendingPostId, posts]);

  useEffect(() => {
    if (!selectedPost) return;
    const stillExists = posts.some((post) => post.id === selectedPost.post.id);
    if (!stillExists) {
      setSelectedPost(null);
    }
  }, [posts, selectedPost]);

  useEffect(() => {
    if (!pendingMessageId) return;
    const target = orderedMessages.find((message) => message.id === pendingMessageId);
    if (target) {
      setHighlightedMessageId(target.id);
      handleMarkMessageRead(target);
      setPendingMessageId(null);
      setTimeout(() => {
        setHighlightedMessageId((current) => (current === target.id ? null : current));
      }, 4000);
    }
  }, [pendingMessageId, orderedMessages]);

  if (!user || !household) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <section className="lg:flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white drop-shadow">Kitchen Board</h1>
            <button
              onClick={() => {
                setComposerState({ body: '', attachment: null, attachmentPreview: undefined });
                setIsComposerOpen(true);
              }}
              className="mario-button flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              New Post
            </button>
          </div>

          {/* Desktop fridge */}
          <div className="hidden lg:block">
            <div className="relative w-full bg-gradient-to-br from-blue-100 via-white to-blue-200 border-4 border-blue-700 rounded-[2.5rem] shadow-2xl aspect-[4/5] overflow-hidden p-6">
              <div className="absolute inset-4 bg-white rounded-[2rem] shadow-inner" />
              <div className="absolute inset-6">
                {fridgePosts.map((post) => {
                  const rotation = (post.id.charCodeAt(0) % 10) - 5;
                  const style: React.CSSProperties = {
                    left: `${post.position.x}%`,
                    top: `${post.position.y}%`,
                    transform: `translate(-50%, -50%) rotate(${rotation}deg)`
                  };

                  return (
                    <button
                      type="button"
                      key={post.id}
                      onClick={() => openPostModal(post)}
                      className="absolute w-48 h-48 bg-yellow-100 border-2 border-yellow-400 shadow-lg flex flex-col justify-between p-4 hover:shadow-2xl transition-shadow"
                      style={style}
                    >
                      <div>
                        <p className="font-bold text-mario-blue text-sm mb-1 line-clamp-1">{post.title}</p>
                        <p className="text-xs text-gray-700 line-clamp-3">{post.preview}</p>
                      </div>
                      {post.attachment && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          {post.attachment.type === 'pdf' ? <FileText size={16} /> : <ImageIcon size={16} />}
                          <span className="truncate">{post.attachment.fileName}</span>
                        </div>
                      )}
                    </button>
                  );
                })}

                {fridgePosts.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <p className="font-bold text-lg">No fridge notes yet</p>
                      <p className="text-sm">Be the first to add a reminder or important info!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile list */}
          <div className="lg:hidden space-y-4">
            {listPosts.length === 0 ? (
              <div className="mario-card text-center">
                <p className="text-gray-600">No posts yet. Tap "New Post" to add one.</p>
              </div>
            ) : (
              listPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => openPostModal(post)}
                  className="w-full text-left bg-white border-2 border-gray-200 rounded-xl shadow-md p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-bold text-mario-blue text-sm">{post.title}</p>
                      <p className="text-xs text-gray-500">By {post.authorName}</p>
                    </div>
                    {post.attachment && (
                      post.attachment.type === 'pdf' ? <FileText size={20} className="text-gray-500" /> : <ImageIcon size={20} className="text-gray-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-3">{post.preview}</p>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Messages */}
        <aside className="lg:w-96 flex flex-col gap-4">
          <div className="mario-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <MessageCircle size={18} />
                Household Messages
              </h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold bg-mario-red text-white rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">To</label>
              <select
                value={messageRecipient}
                onChange={(event) => setMessageRecipient(event.target.value)}
                className="mario-input"
              >
                {members.filter((member) => member.id !== user.id).map((member) => (
                  <option key={member.id} value={member.id}>{member.displayName}</option>
                ))}
              </select>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                  className="mario-textarea"
                  rows={4}
                  placeholder="Leave an encouraging note or share information"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Include Gems ({messageGems})</label>
                <input
                  type="range"
                  min={0}
                  max={user.gems}
                  value={messageGems}
                  onChange={(event) => setMessageGems(Number(event.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">You currently have {user.gems} gems available.</p>
              </div>

              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !messageRecipient || !messageBody.trim()}
                className="mario-button-green flex items-center justify-center gap-2 text-sm"
              >
                {sendingMessage ? (
                  'Sending...'
                ) : (
                  <>
                    <Send size={16} />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mario-card h-[480px] overflow-y-auto">
            {orderedMessages.length === 0 ? (
              <p className="text-sm text-gray-500">No messages yet. Start a conversation!</p>
            ) : (
              <div className="space-y-4">
                {orderedMessages.map((message) => {
                  const isSender = message.senderId === user.id;
                  const otherParty = isSender ? message.recipientId : message.senderId;
                  const name = getMemberName(otherParty);
                  const hasGems = message.gems > 0;
                  const isHighlighted = message.id === highlightedMessageId;

                  return (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        isHighlighted
                          ? 'border-yellow-400 bg-yellow-50'
                          : !isSender && !message.readAt
                            ? 'border-mario-blue bg-blue-50'
                            : 'border-gray-200 bg-white'
                      }`}
                      onClick={() => handleMarkMessageRead(message)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-gray-800 text-sm">
                          {isSender ? `To ${name}` : `From ${name}`}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{message.body}</p>
                      <div className="flex justify-between items-center">
                        {hasGems ? (
                          <span className="text-xs font-semibold text-mario-green">{message.gems} gems attached</span>
                        ) : (
                          <span className="text-xs text-gray-400">No gems</span>
                        )}
                        {!isSender && !message.readAt && (
                          <span className="text-xs font-semibold text-mario-blue">Tap to mark read</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Post composer modal */}
      {isComposerOpen && (
        <Modal onClose={resetComposer}>
          <div className="bg-white rounded-2xl border-4 border-mario-blue shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {composerState.editingPost ? 'Edit Post' : 'New Post'}
              </h2>
              <button onClick={resetComposer} className="text-gray-500 hover:text-gray-800">
                <X size={20} />
              </button>
            </div>
            <MarkdownToolbar textareaRef={textareaRef} onTextChange={(text) => setComposerState((prev) => ({ ...prev, body: text }))} />
            <textarea
              ref={textareaRef}
              value={composerState.body}
              onChange={(event) => setComposerState((prev) => ({ ...prev, body: event.target.value }))}
              className="mario-textarea"
              rows={10}
              placeholder="Write your update, grocery list, or friendly reminder..."
            />

            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Paperclip size={16} />
                Attachment (optional)
              </label>
              <input type="file" accept="image/png,image/jpeg,application/pdf" onChange={handleAttachmentChange} />
              {composerState.attachmentPreview && (
                <img src={composerState.attachmentPreview} alt="Preview" className="w-32 h-32 object-cover border rounded-lg" />
              )}
              {!composerState.attachmentPreview && composerState.attachment && composerState.attachment.type === 'application/pdf' && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText size={18} />
                  <span>{composerState.attachment.name}</span>
                </div>
              )}
              {!composerState.attachmentPreview && !composerState.attachment && composerState.editingPost?.attachment && composerState.editingPost.attachment.type === 'pdf' && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText size={18} />
                  <span>{composerState.editingPost.attachment.fileName}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="mario-button-blue px-6"
                onClick={handleSavePost}
                disabled={isSavingPost}
              >
                {isSavingPost ? 'Saving...' : 'Save Post'}
              </button>
              <button className="mario-button px-6" onClick={resetComposer}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Post details modal */}
      {selectedPost && (
        <Modal onClose={closePostModal}>
          <div className="bg-white rounded-2xl border-4 border-mario-blue shadow-2xl max-w-3xl w-full p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">{selectedPost.post.title}</h2>
                <p className="text-sm text-gray-500">Posted by {selectedPost.post.authorName}</p>
              </div>
              <div className="flex items-center gap-2">
                {canEditPost(selectedPost.post) && (
                  <>
                    <button
                      onClick={handleEditWithinModal}
                      className="mario-button-blue flex items-center gap-2 text-xs px-3 py-2"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleConfirmDelete(selectedPost.post)}
                      className="mario-button flex items-center gap-2 text-xs px-3 py-2"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </>
                )}
                <button onClick={closePostModal} className="text-gray-500 hover:text-gray-800">
                  <X size={20} />
                </button>
              </div>
            </div>

            <MarkdownRenderer content={selectedPost.post.body} className="prose prose-sm max-w-none" />

            {selectedPost.post.attachment && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-2">Attachment</h3>
                {selectedPost.post.attachment.type === 'pdf' ? (
                  <a
                    href={selectedPost.post.attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mario-button-blue inline-flex items-center gap-2 text-sm"
                  >
                    <FileText size={16} />
                    Download {selectedPost.post.attachment.fileName}
                  </a>
                ) : (
                  <img
                    src={selectedPost.post.attachment.url}
                    alt={selectedPost.post.attachment.fileName}
                    className="max-w-full rounded-lg border"
                  />
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {isConfirmDeleteOpen && postPendingDelete && (
        <Modal onClose={() => setIsConfirmDeleteOpen(false)}>
          <div className="bg-white rounded-2xl border-4 border-mario-blue shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Delete this post?</h3>
            <p className="text-sm text-gray-600">
              This will remove the note from the household fridge for everyone. This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button className="mario-button px-4" onClick={() => setIsConfirmDeleteOpen(false)}>Cancel</button>
              <button className="mario-button-blue px-4" onClick={executeDeletePost}>Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-h-[95vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default KitchenBoard;
