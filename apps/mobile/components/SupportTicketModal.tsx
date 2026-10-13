import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/colors';
import {
  Ticket,
  TicketMessage,
  fetchUserTickets,
  createTicket,
  fetchTicketMessages,
  sendTicketMessage,
} from '../services/supabase/ticketService';

interface SupportTicketModalProps {
  visible: boolean;
  onClose: () => void;
  initialOrderId?: string;
}

const FAQ_META = [0, 1, 2, 3, 4];

const CATEGORY_META = [
  { id: 'DELIVERY_ISSUE', icon: 'bicycle-outline' },
  { id: 'CHEF_ISSUE', icon: 'restaurant-outline' },
  { id: 'PAYMENT_ISSUE', icon: 'card-outline' },
  { id: 'WALLET_ISSUE', icon: 'wallet-outline' },
  { id: 'TECHNICAL_ISSUE', icon: 'hardware-chip-outline' },
  { id: 'ACCOUNT_ISSUE', icon: 'shield-checkmark-outline' },
  { id: 'OTHER', icon: 'help-circle-outline' },
];

const PRIORITY_META = [
  { id: 'LOW', color: '#10B981' },
  { id: 'MEDIUM', color: '#F59E0B' },
  { id: 'HIGH', color: '#EF4444' },
  { id: 'URGENT', color: '#DC2626' },
];

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({
  visible,
  onClose,
  initialOrderId,
}) => {
  const { t } = useTranslation();
  const FAQ_ITEMS = FAQ_META.map((i) => ({
    category: t(`support.faq.${i}.category`),
    q: t(`support.faq.${i}.q`),
    a: t(`support.faq.${i}.a`),
  }));
  const CATEGORIES = CATEGORY_META.map((c) => ({ ...c, label: t(`support.cat.${c.id}`) }));
  const PRIORITIES = PRIORITY_META.map((p) => ({ ...p, label: t(`support.prio.${p.id}`) }));
  const [activeTab, setActiveTab] = useState<'faq' | 'tickets' | 'create'>('tickets');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Form states for creating a ticket
  const [category, setCategory] = useState('DELIVERY_ISSUE');
  const [priority, setPriority] = useState('MEDIUM');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // FAQ search & expanded state
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    if (visible) {
      loadTickets();
      if (initialOrderId) {
        setCategory('DELIVERY_ISSUE');
        setSubject(t('support.issueRegardingOrder', { defaultValue: 'Issue regarding Order #{{id}}', id: initialOrderId.slice(0, 8) }));
        setActiveTab('create');
      }
    }
  }, [visible, initialOrderId]);

  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const data = await fetchUserTickets();
      setTickets(data);
    } catch (err) {
      console.warn('Error loading tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const openTicketDetail = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    try {
      const msgs = await fetchTicketMessages(ticket.id);
      setMessages(msgs);
    } catch (err) {
      console.warn('Error loading msgs:', err);
    }
  };

  const handleSendReply = async () => {
    if (!chatInput.trim() || !selectedTicket) return;
    setSendingMsg(true);
    const text = chatInput.trim();
    setChatInput('');
    try {
      const newMsg = await sendTicketMessage(selectedTicket.id, text);
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.warn('Failed sending msg:', err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCreateSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      alert(t('support.fillBoth', 'Please fill out both Subject and Description.'));
      return;
    }
    setSubmitting(true);
    try {
      const newTkt = await createTicket({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        order_id: initialOrderId,
      });

      setSuccessBanner(t('support.tokenCreated', { defaultValue: 'Support Ticket #{{id}} created successfully!', id: newTkt.id.slice(0, 8).toUpperCase() }));
      setSubject('');
      setDescription('');
      await loadTickets();
      setTimeout(() => {
        setSuccessBanner(null);
        setActiveTab('tickets');
      }, 1500);
    } catch (err) {
      alert(t('support.submitFailed', 'Failed to submit support ticket. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaqs = FAQ_ITEMS.filter(
    (f) =>
      f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.a.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.category.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return { label: t('support.status.OPEN', 'OPEN'), bg: '#EFF6FF', color: '#2563EB' };
      case 'IN_PROGRESS':
        return { label: t('support.status.IN_PROGRESS', 'IN PROGRESS'), bg: '#FEF3C7', color: '#D97706' };
      case 'RESOLVED':
        return { label: t('support.status.RESOLVED', 'RESOLVED'), bg: '#D1FAE5', color: '#059669' };
      case 'CLOSED':
        return { label: t('support.status.CLOSED', 'CLOSED'), bg: '#F3F4F6', color: '#6B7280' };
      default:
        return { label: status, bg: '#F3F4F6', color: '#6B7280' };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Ionicons name="headset-outline" size={22} color={Colors.primary} />
              <Text style={styles.headerTitle}>{t('support.headerTitle', 'Help & Support Desk')}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </Pressable>
          </View>

          {/* Subheader Banner */}
          <View style={styles.banner}>
            <Ionicons name="sparkles" size={16} color="#4F46E5" />
            <Text style={styles.bannerText}>
              {t('support.banner', '24/7 CRM Support • Live Ticket Resolution • FAQs')}
            </Text>
          </View>

          {/* Tabs */}
          {!selectedTicket && (
            <View style={styles.tabRow}>
              <Pressable
                style={[styles.tabBtn, activeTab === 'tickets' && styles.tabBtnActive]}
                onPress={() => setActiveTab('tickets')}
              >
                <Ionicons
                  name="ticket-outline"
                  size={16}
                  color={activeTab === 'tickets' ? Colors.primary : '#64748B'}
                />
                <Text
                  style={[styles.tabText, activeTab === 'tickets' && styles.tabTextActive]}
                >
                  {t('support.myTokens', { defaultValue: 'My CRM Tickets ({{count}})', count: tickets.length })}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.tabBtn, activeTab === 'create' && styles.tabBtnActive]}
                onPress={() => setActiveTab('create')}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={16}
                  color={activeTab === 'create' ? Colors.primary : '#64748B'}
                />
                <Text
                  style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}
                >
                  {t('support.raiseToken', 'Raise Ticket')}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.tabBtn, activeTab === 'faq' && styles.tabBtnActive]}
                onPress={() => setActiveTab('faq')}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={16}
                  color={activeTab === 'faq' ? Colors.primary : '#64748B'}
                />
                <Text
                  style={[styles.tabText, activeTab === 'faq' && styles.tabTextActive]}
                >
                  {t('support.faqs', 'FAQs')}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Success Banner */}
          {successBanner && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.successText}>{successBanner}</Text>
            </View>
          )}

          {/* Body Content */}
          <View style={styles.body}>
            {/* 1. TICKET DETAIL VIEW */}
            {selectedTicket ? (
              <View style={styles.detailContainer}>
                <Pressable
                  style={styles.backLink}
                  onPress={() => setSelectedTicket(null)}
                >
                  <Ionicons name="arrow-back" size={18} color={Colors.primary} />
                  <Text style={styles.backLinkText}>{t('support.backToTokens', 'Back to all tickets')}</Text>
                </Pressable>

                <View style={styles.ticketCardHeader}>
                  <View style={styles.ticketMetaRow}>
                    <Text style={styles.ticketTokenId}>
                      {t('support.token', { defaultValue: 'TICKET #{{id}}', id: selectedTicket.id.slice(0, 8).toUpperCase() })}
                    </Text>
                    {(() => {
                      const badge = getStatusBadge(selectedTicket.status);
                      return (
                        <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.statusPillText, { color: badge.color }]}>
                            {badge.label}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                  <Text style={styles.ticketSubject}>{selectedTicket.subject}</Text>
                  <Text style={styles.ticketDesc}>{selectedTicket.description}</Text>
                </View>

                {/* Messages Chat Feed */}
                <Text style={styles.sectionHeader}>{t('support.crmHistory', 'CRM Communication History')}</Text>
                <ScrollView style={styles.chatScroll} contentContainerStyle={{ paddingVertical: 8 }}>
                  {messages.length === 0 ? (
                    <Text style={styles.emptyText}>{t('support.noReplies', 'No reply messages yet. CRM staff will respond shortly.')}</Text>
                  ) : (
                    messages.map((m) => {
                      const isUser = m.sender_id !== 'ops-agent-1';
                      return (
                        <View
                          key={m.id}
                          style={[
                            styles.msgBubble,
                            isUser ? styles.msgBubbleUser : styles.msgBubbleSupport,
                          ]}
                        >
                          <Text style={styles.msgSender}>
                            {isUser ? t('support.you', 'You') : t('support.supportSpecialist', 'Support Specialist')}
                          </Text>
                          <Text
                            style={[
                              styles.msgText,
                              isUser ? styles.msgTextUser : styles.msgTextSupport,
                            ]}
                          >
                            {m.message}
                          </Text>
                          <Text
                            style={[
                              styles.msgTime,
                              isUser ? styles.msgTimeUser : styles.msgTimeSupport,
                            ]}
                          >
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      );
                    })
                  )}
                </ScrollView>

                {/* Reply Bar */}
                <View style={styles.replyBar}>
                  <TextInput
                    style={styles.replyInput}
                    placeholder={t('support.typeFollowUp', 'Type follow-up response...')}
                    placeholderTextColor="#94A3B8"
                    value={chatInput}
                    onChangeText={setChatInput}
                  />
                  <Pressable
                    style={[styles.sendBtn, !chatInput.trim() && styles.sendBtnDisabled]}
                    onPress={handleSendReply}
                    disabled={!chatInput.trim() || sendingMsg}
                  >
                    {sendingMsg ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="send" size={16} color="#FFFFFF" />
                    )}
                  </Pressable>
                </View>
              </View>
            ) : activeTab === 'tickets' ? (
              /* 2. MY TICKETS LIST */
              <ScrollView style={styles.scrollList} contentContainerStyle={{ paddingBottom: 24 }}>
                {loadingTickets ? (
                  <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 30 }} />
                ) : tickets.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="ticket-outline" size={48} color="#CBD5E1" />
                    <Text style={styles.emptyTitle}>{t('support.noTokensTitle', 'No CRM Tickets Raised Yet')}</Text>
                    <Text style={styles.emptySub}>
                      {t('support.noTokensSub', 'Have a query regarding payouts, food quality, or orders? Raise a ticket and get resolved fast.')}
                    </Text>
                    <Pressable style={styles.primaryActionBtn} onPress={() => setActiveTab('create')}>
                      <Ionicons name="add" size={18} color="#FFFFFF" />
                      <Text style={styles.primaryActionBtnText}>{t('support.raiseSupportToken', 'Raise a Support Ticket')}</Text>
                    </Pressable>
                  </View>
                ) : (
                  tickets.map((tkt) => {
                    const badge = getStatusBadge(tkt.status);
                    return (
                      <Pressable
                        key={tkt.id}
                        style={styles.ticketCard}
                        onPress={() => openTicketDetail(tkt)}
                      >
                        <View style={styles.ticketCardTop}>
                          <View style={styles.tokenTag}>
                            <Text style={styles.tokenTagText}>
                              #{tkt.id.slice(0, 8).toUpperCase()}
                            </Text>
                          </View>
                          <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
                            <Text style={[styles.statusPillText, { color: badge.color }]}>
                              {badge.label}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.tSubject}>{tkt.subject}</Text>
                        <Text style={styles.tDesc} numberOfLines={2}>
                          {tkt.description}
                        </Text>
                        <View style={styles.ticketCardBottom}>
                          <Text style={styles.tDate}>
                            {new Date(tkt.created_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                          <View style={styles.chatLink}>
                            <Text style={styles.chatLinkText}>{t('support.viewUpdates', 'View updates & chat')}</Text>
                            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                          </View>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            ) : activeTab === 'create' ? (
              /* 3. CREATE TICKET FORM */
              <ScrollView style={styles.scrollList} contentContainerStyle={{ paddingBottom: 24 }}>
                <Text style={styles.formSectionTitle}>{t('support.step1', '1. Select Ticket Category')}</Text>
                <View style={styles.catGrid}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.catPill,
                        category === cat.id && styles.catPillActive,
                      ]}
                      onPress={() => setCategory(cat.id)}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={16}
                        color={category === cat.id ? Colors.primary : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.catPillText,
                          category === cat.id && styles.catPillTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.formSectionTitle}>{t('support.step2', '2. Priority Level')}</Text>
                <View style={styles.prioRow}>
                  {PRIORITIES.map((p) => (
                    <Pressable
                      key={p.id}
                      style={[
                        styles.prioPill,
                        priority === p.id && { borderColor: p.color, backgroundColor: `${p.color}15` },
                      ]}
                      onPress={() => setPriority(p.id)}
                    >
                      <View style={[styles.prioDot, { backgroundColor: p.color }]} />
                      <Text style={[styles.prioText, priority === p.id && { color: p.color, fontWeight: '700' }]}>
                        {p.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.formSectionTitle}>{t('support.step3', '3. Subject Summary')}</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder={t('support.subjectPlaceholder', 'e.g. Discrepancy in Sunday payout settlement')}
                  placeholderTextColor="#94A3B8"
                  value={subject}
                  onChangeText={setSubject}
                />

                <Text style={styles.formSectionTitle}>{t('support.step4', '4. Detailed Description')}</Text>
                <TextInput
                  style={[styles.inputField, styles.textArea]}
                  placeholder={t('support.descPlaceholder', 'Provide all relevant details, order reference numbers, or dish names...')}
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                />

                <Pressable
                  style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                  onPress={handleCreateSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>{t('support.submitToken', 'Submit CRM Support Ticket')}</Text>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            ) : (
              /* 4. FAQ VIEW */
              <ScrollView style={styles.scrollList} contentContainerStyle={{ paddingBottom: 24 }}>
                <View style={styles.searchBarWrap}>
                  <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={t('support.searchFaq', 'Search FAQ questions...')}
                    placeholderTextColor="#94A3B8"
                    value={faqSearch}
                    onChangeText={setFaqSearch}
                  />
                </View>

                {filteredFaqs.map((faq, idx) => {
                  const isExpanded = expandedFaqIndex === idx;
                  return (
                    <View key={idx} style={styles.faqCard}>
                      <Pressable
                        style={styles.faqHeader}
                        onPress={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.faqCat}>{faq.category}</Text>
                          <Text style={styles.faqQ}>{faq.q}</Text>
                        </View>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color="#64748B"
                        />
                      </Pressable>
                      {isExpanded && <Text style={styles.faqA}>{faq.a}</Text>}
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '88%',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#FFF7ED',
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  successText: {
    color: '#065F46',
    fontWeight: '600',
    fontSize: 13,
  },
  body: {
    flex: 1,
  },
  scrollList: {
    flex: 1,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  ticketCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tokenTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  tDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 10,
  },
  ticketCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  tDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  chatLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chatLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  // Form styles
  formSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
    marginBottom: 8,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: '#FFF7ED',
    borderColor: Colors.primary,
  },
  catPillText: {
    fontSize: 12,
    color: '#64748B',
  },
  catPillTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  prioRow: {
    flexDirection: 'row',
    gap: 8,
  },
  prioPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  prioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  prioText: {
    fontSize: 12,
    color: '#64748B',
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    height: 90,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // FAQ styles
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqCat: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  faqQ: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  faqA: {
    fontSize: 13,
    color: '#475569',
    marginTop: 8,
    lineHeight: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  // Chat view styles
  detailContainer: {
    flex: 1,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  ticketCardHeader: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  ticketMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ticketTokenId: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  ticketDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginVertical: 4,
  },
  chatScroll: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 20,
  },
  msgBubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  msgBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  msgBubbleSupport: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 2,
  },
  msgSender: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  msgTextUser: {
    color: '#FFFFFF',
  },
  msgTextSupport: {
    color: '#0F172A',
  },
  msgTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  msgTimeUser: {
    color: '#FED7AA',
  },
  msgTimeSupport: {
    color: '#94A3B8',
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
