import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import apiClient from "../api/apiClient";
import { FONTS, RADIUS, SIZES, GRADIENTS, SHADOWS } from "../constants/theme";
import useAuthStore from "../store/useAuthStore";
import useSocketStore from "../store/useSocketStore";
import useThemeStore from "../store/useThemeStore";

const { width } = Dimensions.get("window");

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
  }
  if (squares.every(Boolean)) return "Draw";
  return null;
}

/**
 * Atmospheric Glow for Active States
 */
const NeonPulse = ({ color, style, styles }) => {
  const opac = useSharedValue(0.4);
  useEffect(() => {
    opac.value = withRepeat(withSequence(withTiming(0.8, { duration: 1500 }), withTiming(0.4, { duration: 1500 })), -1, true);
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opac.value,
    shadowColor: color,
    shadowOpacity: opac.value,
  }));
  return <Animated.View style={[styles.pulseCircle, { backgroundColor: color }, style, animStyle]} />;
};

const MarkCell = ({ value, onPress, styles, colors, mode, index }) => {
  const scale = useSharedValue(0);
  useEffect(() => {
    if (value) scale.value = withSpring(1, { damping: 12 });
    else scale.value = 0;
  }, [value]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const markShadow = value === "X" ? SHADOWS.purple : SHADOWS.neon;

  return (
    <TouchableOpacity 
      style={[styles.cell, value && styles.cellOccupied]} 
      onPress={() => onPress(index)}
      activeOpacity={0.7}
    >
      {!value && <View style={[styles.cellDot, { backgroundColor: colors.borderLight }]} />}
      <Animated.View style={[animStyle, markShadow, { alignItems: 'center', justifyContent: 'center' }]}>
         <Text style={[styles.cellText, value === "X" ? styles.textPrimary : styles.textSecondary]}>
           {value}
         </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const TicTacToe = ({ styles, colors, mode }) => {
  const { user } = useAuthStore();
  const socket = useSocketStore((state) => state.socket);
  const partnerId = user?.partnerId;

  const [partnerName, setPartnerName] = useState("Partner");
  const [myMark, setMyMark] = useState(null);
  const [partnerMark, setPartnerMark] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState("X");
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ me: 0, partner: 0 });

  useEffect(() => {
    apiClient.get("/auth/partner").then((res) => setPartnerName(res.data?.name || "Partner")).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleMarkReceived = ({ chosenMark }) => {
      const opposite = chosenMark === "X" ? "O" : "X";
      setPartnerMark(chosenMark);
      setMyMark(opposite);
    };
    const handleMoveReceived = (data) => {
      setBoard(data.board);
      setCurrentTurn(data.currentTurn);
      if (data.winner) {
        setWinner(data.winner);
        if (data.winner !== "Draw") {
          setScores(s => ({
            ...s,
            me: data.winner === myMark ? s.me + 1 : s.me,
            partner: data.winner !== myMark ? s.partner + 1 : s.partner
          }));
        }
      }
    };
    const handleResetReceived = () => {
      setBoard(Array(9).fill(null));
      setCurrentTurn("X");
      setWinner(null);
      setMyMark(null);
      setPartnerMark(null);
    };
    const handleScoreResetReceived = () => {
      setScores({ me: 0, partner: 0 });
    };

    socket.on("game_mark_received", handleMarkReceived);
    socket.on("game_move_received", handleMoveReceived);
    socket.on("game_reset_received", handleResetReceived);
    socket.on("game_score_reset_received", handleScoreResetReceived);

    return () => {
      socket.off("game_mark_received", handleMarkReceived);
      socket.off("game_move_received", handleMoveReceived);
      socket.off("game_reset_received", handleResetReceived);
      socket.off("game_score_reset_received", handleScoreResetReceived);
    };
  }, [socket, myMark]);

  const isMyTurn = !!myMark && currentTurn === myMark && !winner;

  const handlePickMark = (mark) => {
    const opposite = mark === "X" ? "O" : "X";
    setMyMark(mark);
    setPartnerMark(opposite);
    if (socket && partnerId) socket.emit("game_mark_selected", { receiverId: partnerId, mark });
  };

  const handlePress = (index) => {
    if (!isMyTurn || board[index] || winner) return;
    const newBoard = [...board];
    newBoard[index] = myMark;
    const nextTurn = myMark === "X" ? "O" : "X";
    const newWinner = calculateWinner(newBoard);
    
    setBoard(newBoard);
    setCurrentTurn(nextTurn);
    if (newWinner) {
      setWinner(newWinner);
      if (newWinner !== "Draw") {
        setScores(s => ({
          ...s,
          me: newWinner === myMark ? s.me + 1 : s.me,
          partner: newWinner === partnerMark ? s.partner + 1 : s.partner
        }));
      }
    }
    
    if (socket && partnerId) {
      socket.emit("game_move", { 
        receiverId: partnerId, 
        board: newBoard, 
        currentTurn: nextTurn, 
        winner: newWinner 
      });
    }
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setCurrentTurn("X");
    setWinner(null);
    setMyMark(null);
    setPartnerMark(null);
    if (socket && partnerId) socket.emit("game_reset", { receiverId: partnerId });
  };

  const handleResetScores = () => {
    setScores({ me: 0, partner: 0 });
    if (socket && partnerId) socket.emit("game_score_reset", { receiverId: partnerId });
  };

  if (!myMark) {
    return (
      <Animated.View entering={FadeInDown.duration(600)} style={styles.gameContainer}>
        <View style={styles.headerCentered}>
          <Text style={styles.eyebrow}>INITIATE CONNECTION</Text>
          <Text style={styles.pickTitle}>Select Your Pulse</Text>
          <Text style={styles.pickSub}>Choose X or O to synchronize with your partner.</Text>
        </View>
        <View style={styles.pickRow}>
          {["X", "O"].map((mark) => (
            <TouchableOpacity key={mark} style={styles.pickCard} onPress={() => handlePickMark(mark)}>
              <LinearGradient
                colors={mark === "X" ? (mode === 'dark' ? ['#8A2BE2', '#480081'] : ['#FFDAD2', '#FFB4A3']) : (mode === 'dark' ? ['#FF4D8D', '#B20055'] : ['#FEB47B', '#FF7E5F'])}
                style={styles.pickGradient}
              >
                <Text style={styles.pickMarkLarge}>{mark}</Text>
                <Text style={styles.pickLabel_2}>PULSE {mark}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(800)} style={styles.gameContainer}>
      {/* Score Header */}
      <View style={styles.scoreHeader}>
         <View style={styles.scoreBlock}>
            <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>RESONANCE SCORE</Text>
            <View style={styles.scoreSplit}>
               <Text style={[styles.scoreNum, { color: colors.primary }]}>{scores.me}</Text>
               <View style={[styles.scoreDivider, { backgroundColor: colors.border }]} />
               <Text style={[styles.scoreNum, { color: colors.secondary }]}>{scores.partner}</Text>
            </View>
         </View>
         <TouchableOpacity style={styles.refreshBtn} onPress={handleResetScores}>
            <Ionicons name="refresh-outline" size={18} color={colors.textMuted} />
         </TouchableOpacity>
      </View>

      <View style={styles.playerRow}>
         <View style={styles.playerWrapper}>
            {isMyTurn && <NeonPulse color={colors.primary} style={styles.badgePulse} styles={styles} />}
            <BlurView intensity={isMyTurn ? 60 : 20} tint={mode === 'dark' ? "dark" : "light"} style={[styles.playerBadge, isMyTurn && styles.badgeActive]}>
              <Text style={[styles.playerMark, { color: colors.primary }]}>{myMark}</Text>
              <Text style={styles.playerLabel}>YOU</Text>
            </BlurView>
         </View>
        
        <Text style={[styles.vsLabel, { color: colors.textMuted }]}>SYNC</Text>
        
        <View style={styles.playerWrapper}>
            {!isMyTurn && <NeonPulse color={colors.secondary} style={styles.badgePulse} styles={styles} />}
            <BlurView intensity={!isMyTurn ? 60 : 20} tint={mode === 'dark' ? "dark" : "light"} style={[styles.playerBadge, !isMyTurn && styles.badgeActivePartner]}>
              <Text style={[styles.playerMark, { color: colors.secondary }]}>{partnerMark}</Text>
              <Text style={styles.playerLabel}>{partnerName.toUpperCase()}</Text>
            </BlurView>
        </View>
      </View>

      <Text style={[styles.statusText, { color: winner ? colors.accent : (isMyTurn ? colors.primary : colors.textMuted) }]}>
        {winner ? (winner === "Draw" ? "SYNC VOID" : `${winner === myMark ? "YOU WIN" : "PARTNER WINS"}`) : (isMyTurn ? "YOUR RHYTHM" : "WAVELENGTH DRIFT...")}
      </Text>

      <View style={[styles.board, { padding: 4, borderRadius: RADIUS.xxl, backgroundColor: colors.surfaceContainerLowest }]}>
        {[0, 1, 2].map(row => (
          <View key={row} style={styles.boardRow}>
            {[0, 1, 2].map(col => {
              const idx = row * 3 + col;
              return (
                <MarkCell 
                  key={idx} 
                  index={idx}
                  value={board[idx]} 
                  onPress={handlePress} 
                  styles={styles} 
                  colors={colors} 
                  mode={mode}
                />
              );
            })}
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.resetBtn, { marginTop: 40 }]} onPress={handleReset}>
        <Text style={styles.resetText}>DISSOLVE & RESTART</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const Quiz = ({ styles, colors, mode }) => {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState(null);

  const handleAnswer = (opt) => {
    if (selected) return;
    setSelected(opt);
    setScore((s) => s + 1);
    setTimeout(() => {
      if (current + 1 >= QUIZ_QUESTIONS.length) setDone(true);
      else { setCurrent(c => c + 1); setSelected(null); }
    }, 700);
  };

  if (done) {
    return (
      <View style={styles.quizDone}>
        <Text style={styles.eyebrow}>SESSION COMPLETE</Text>
        <Text style={[styles.quizDoneTitle, { color: colors.text }]}>Resonance{"\n"}Achieved</Text>
        <Text style={[styles.quizDoneSub, { color: colors.textSub }]}>You achieved {score}/{QUIZ_QUESTIONS.length} resonance points.</Text>
        <TouchableOpacity style={styles.resetBtn} onPress={() => { setCurrent(0); setScore(0); setDone(false); setSelected(null); }}>
          <Text style={styles.resetText}>REINITIATE QUIZ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const q = QUIZ_QUESTIONS[current];
  return (
    <View style={styles.quizContainer}>
       <Text style={styles.eyebrow}>RESONANCE TEST {current + 1}/{QUIZ_QUESTIONS.length}</Text>
       <View style={[styles.quizProgressBar, { backgroundColor: colors.surfaceContainerLow }]}><View style={[styles.quizProgressFill, { width: `${((current + 1) / QUIZ_QUESTIONS.length) * 100}%`, backgroundColor: colors.secondary }]} /></View>
       <Text style={[styles.quizQuestion, { color: colors.text }]}>{q.q}</Text>
       <View style={styles.quizOptions}>
         {q.options.map(opt => (
            <TouchableOpacity 
              key={opt} 
              style={[
                styles.quizOption, 
                selected === opt && { borderColor: colors.secondary, borderWidth: 1.5 }, 
                selected && selected !== opt && { opacity: 0.3 }
              ]} 
              onPress={() => handleAnswer(opt)} 
              disabled={!!selected}
            >
              <BlurView intensity={selected === opt ? 50 : 20} tint={mode === 'dark' ? "dark" : "light"} style={styles.optionBlur}>
                <Text style={[styles.quizOptionText, { color: colors.text }, selected === opt && { color: colors.secondary, fontWeight: FONTS.semibold }]}>{opt}</Text>
              </BlurView>
            </TouchableOpacity>
         ))}
       </View>
    </View>
  );
};

const QUIZ_QUESTIONS = [
  { q: "What's my favourite colour?", options: ["Blue", "Purple", "Red", "Green"] },
  { q: "What would I choose: beach or mountains?", options: ["Beach", "Mountains", "City", "Countryside"] },
  { q: "My love language is?", options: ["Words of Affirmation", "Physical Touch", "Acts of Service", "Gift Giving"] },
  { q: "I'm usually a...", options: ["Morning person", "Night owl", "Both", "Neither"] },
  { q: "Comfort food for me is?", options: ["Pizza", "Noodles", "Ice cream", "Biryani"] },
];

const GamesScreen = () => {
  const { colors, mode } = useThemeStore();
  const styles = createStyles(colors, mode);
  const [activeGame, setActiveGame] = useState(null);

  const renderBack = () => (
    <TouchableOpacity onPress={() => setActiveGame(null)} style={styles.backBtn}>
      <Text style={styles.backText}>← RETURN TO PLAYGROUND</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.glow, { backgroundColor: mode === 'dark' ? "rgba(138, 43, 226, 0.04)" : "rgba(165, 59, 34, 0.05)" }]} />
      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!activeGame ? (
          <>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>COOPERATIVE REALM</Text>
              <Text style={[styles.heading, { color: colors.text }]}>Playground{"\n"}Editorial</Text>
              <Text style={[styles.sub, { color: colors.textSub }]}>Forge connections through shared rhythm and cognitive resonance.</Text>
            </View>

            <TouchableOpacity style={styles.editorialCard} onPress={() => setActiveGame("ttt")} activeOpacity={0.9}>
              <LinearGradient
                colors={mode === 'dark' ? ['transparent', 'transparent'] : ['#FFFFFF', '#F8F3E9']}
                style={styles.cardGradient}
              >
                <BlurView intensity={mode === 'dark' ? 35 : 0} tint={mode === 'dark' ? "dark" : "light"} style={styles.cardBlur}>
                  <View style={[styles.iconWrapper, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <Text style={styles.cardIcon}>⚔️</Text>
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>TIC TAC TOE</Text>
                    <Text style={[styles.cardSub, { color: colors.primary }]}>REAL-TIME PULSE SYNC</Text>
                  </View>
                </BlurView>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.editorialCard} onPress={() => setActiveGame("quiz")} activeOpacity={0.9}>
               <LinearGradient
                colors={mode === 'dark' ? ['transparent', 'transparent'] : ['#FFFFFF', '#F8F3E9']}
                style={styles.cardGradient}
              >
                <BlurView intensity={mode === 'dark' ? 35 : 0} tint={mode === 'dark' ? "dark" : "light"} style={styles.cardBlur}>
                  <View style={[styles.iconWrapper, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <Text style={styles.cardIcon}>💡</Text>
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>RESONANCE TEST</Text>
                    <Text style={[styles.cardSub, { color: colors.secondary }]}>COGNITIVE ALIGNMENT</Text>
                  </View>
                </BlurView>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Animated.View entering={FadeInDown}>
               {renderBack()}
               {activeGame === "ttt" ? <TicTacToe styles={styles} colors={colors} mode={mode} /> : <Quiz styles={styles} colors={colors} mode={mode} />}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors, mode) => {
  const lightShadow = {
    shadowColor: "#8B716B",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  };

  return StyleSheet.create({
    root: { flex: 1 },
    glow: {
      position: "absolute", width: width * 1.2, height: width * 1.2, borderRadius: width * 0.6,
      top: -width * 0.5, left: -width * 0.3,
    },
    scroll: { paddingHorizontal: 28, paddingTop: 80, paddingBottom: 60 },
    header: { marginBottom: 44 },
    eyebrow: { fontFamily: FONTS.label, fontSize: 10, color: colors.primary, letterSpacing: 3, marginBottom: 12 },
    heading: { fontFamily: FONTS.display, fontSize: SIZES.display * 0.75, lineHeight: SIZES.display * 0.75, marginBottom: 16 },
    sub: { fontFamily: FONTS.body, fontSize: SIZES.md, width: "85%", lineHeight: 24, opacity: 0.8 },
    backBtn: { marginBottom: 32 },
    backText: { fontFamily: FONTS.label, color: colors.textMuted, fontSize: 10, letterSpacing: 2 },
    
    editorialCard: { 
      marginBottom: 20, 
      borderRadius: RADIUS.xxl, 
      overflow: "hidden", 
      ...(mode === 'dark' ? SHADOWS.ambient : lightShadow) 
    },
    cardGradient: { flex: 1 },
    cardBlur: { flexDirection: "row", alignItems: "center", padding: 24, gap: 16, borderColor: mode === 'dark' ? colors.borderLight : colors.border },
    iconWrapper: { width: 64, height: 64, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center' },
    cardIcon: { fontSize: 28, color: colors.text },
    cardTitle: { fontFamily: FONTS.headline, fontSize: SIZES.lg, color: colors.text, letterSpacing: 0.5 },
    cardSub: { fontFamily: FONTS.label, fontSize: 9, letterSpacing: 2, marginTop: 4 },
    
    headerCentered: { alignItems: 'center', marginBottom: 40 },
    gameContainer: { width: "100%" },
    
    scoreHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingHorizontal: 4 },
    scoreBlock: { flex: 1, alignItems: 'center' },
    scoreLabel: { fontFamily: FONTS.label, fontSize: 8, letterSpacing: 2.5, marginBottom: 12 },
    scoreSplit: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    scoreNum: { fontFamily: FONTS.display, fontSize: 36, lineHeight: 40 },
    scoreDivider: { width: 1, height: 24, transform: [{ rotate: '15deg' }] },
    refreshBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', position: 'absolute', right: 0, top: 0 },

    pickTitle: { fontFamily: FONTS.display, fontSize: SIZES.xxl, color: colors.text, textAlign: "center", marginBottom: 8 },
    pickSub: { fontFamily: FONTS.body, fontSize: SIZES.base, color: colors.textSub, textAlign: "center", marginBottom: 40, lineHeight: 22, maxWidth: 260 },
    pickRow: { flexDirection: "row", gap: 20 },
    pickCard: { flex: 1, height: 210, borderRadius: RADIUS.xxl, overflow: "hidden" },
    pickGradient: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
    pickMarkLarge: { fontFamily: FONTS.display, fontSize: 80, color: '#FFF', marginBottom: 12 },
    pickLabel_2: { fontFamily: FONTS.label, fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: 2.5 },
    
    playerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 40 },
    playerWrapper: { position: 'relative', width: 110, height: 110 },
    badgePulse: { position: 'absolute', width: 110, height: 110, borderRadius: RADIUS.xl, top: 0, left: 0 },
    playerBadge: { flex: 1, paddingVertical: 18, borderRadius: RADIUS.xl, overflow: "hidden", alignItems: "center", borderWidth: 1.5, borderColor: colors.borderLight },
    badgeActive: { borderColor: colors.primary },
    badgeActivePartner: { borderColor: colors.secondary },
    playerMark: { fontFamily: FONTS.display, fontSize: 32 },
    playerLabel: { fontFamily: FONTS.label, fontSize: 8, color: colors.textMuted, letterSpacing: 2, marginTop: 6 },
    vsLabel: { fontFamily: FONTS.label, fontSize: 10, letterSpacing: 4 },
    
    statusText: { fontFamily: FONTS.headline, fontSize: SIZES.md, textAlign: "center", marginBottom: 32, letterSpacing: 3, textTransform: 'uppercase' },
    board: { gap: 12, alignSelf: "center", padding: 12, borderRadius: RADIUS.xxl },
    boardRow: { flexDirection: "row", gap: 12 },
    cell: { 
      width: width * 0.22, 
      height: width * 0.22, 
      borderRadius: RADIUS.xl, 
      backgroundColor: mode === 'dark' ? colors.surfaceContainerLow : colors.surfaceContainer, 
      alignItems: "center", 
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    cellOccupied: { backgroundColor: colors.surfaceContainerHighest, borderColor: 'transparent' },
    cellDot: { width: 4, height: 4, borderRadius: 2, opacity: 0.3 },
    cellText: { fontFamily: FONTS.display, fontSize: 48, lineHeight: 52 },
    
    pulseCircle: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: RADIUS.xl },
    
    resetBtn: { paddingVertical: 18, alignItems: "center", borderRadius: RADIUS.full, borderWidth: 1.2, borderColor: colors.border },
    resetText: { fontFamily: FONTS.label, color: colors.textMuted, fontSize: 10, letterSpacing: 2 },
    
    quizContainer: { width: "100%" },
    quizProgressBar: { width: "100%", height: 4, borderRadius: 2, marginBottom: 40, overflow: "hidden" },
    quizProgressFill: { height: "100%" },
    quizQuestion: { fontFamily: FONTS.display, fontSize: SIZES.xxl, textAlign: "center", marginBottom: 48, lineHeight: 36 },
    quizOptions: { gap: 18 },
    quizOption: { borderRadius: RADIUS.xxl, overflow: "hidden", ...SHADOWS.ambient },
    optionBlur: { paddingVertical: 24, alignItems: "center", borderWidth: 1, borderColor: colors.borderLight },
    quizOptionText: { fontFamily: FONTS.body, fontSize: SIZES.md },
    
    quizDone: { paddingTop: 20 },
    quizDoneTitle: { fontFamily: FONTS.display, fontSize: SIZES.display * 0.6, marginBottom: 16, lineHeight: SIZES.display * 0.6 },
    quizDoneSub: { fontFamily: FONTS.body, fontSize: SIZES.md, marginBottom: 48, lineHeight: 26, opacity: 0.8 },
    
    textPrimary: { color: colors.primary },
    textSecondary: { color: colors.secondary },
  });
};

export default GamesScreen;
