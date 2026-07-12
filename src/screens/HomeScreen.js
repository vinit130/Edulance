import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  calculateDistance,
} from "../services/location";
import {
  View,
  Text,
  FlatList,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  signOut,
} from "firebase/auth";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

import {
  LinearGradient,
} from "expo-linear-gradient";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  auth,
  db,
} from "../services/firebaseConfig";

import TaskCard from "../components/TaskCard";

export default function HomeScreen({ navigation }) {
  
  const [tasks, setTasks] = useState([]);
const [userLocation, setUserLocation] = useState(null);

const [selectedDistance, setSelectedDistance] =
  useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("Open");
  const [selectedSort, setSelectedSort] = useState("Newest");

  const [searchText, setSearchText] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");

  const categories = [
    "All",
    "Coding",
    "Design",
    "Presentation",
    "Writing",
    "Other",
  ];

  const statusFilters = [
    "All",
    "Open",
    "Assigned",
    "In Progress",
    "Completed",
  ];

  const sortOptions = [
    "Newest",
    "Oldest",
    "Budget High",
    "Budget Low",
  ];
  const distanceOptions = [
  "All",
  "2 km",
  "5 km",
  "10 km",
  "20 km",
  "50 km",
];

  useEffect(() => {
    const q = query(
      collection(db, "tasks"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTasks = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setTasks(fetchedTasks);
        setLoading(false);
        setRefreshing(false);
        setErrorText("");
      },

      
      (error) => {
        console.log("Home tasks load error:", error.message);
        setErrorText(error.message);
        setLoading(false);
        setRefreshing(false);
      }
    );

async function loadLocation() {
    try {
      const location =
        await getCurrentLocation();

      setUserLocation(location);
    } catch (e) {
      console.log("Location unavailable");
    }
  }

  loadLocation();

    return unsubscribe;
  }, []);

  

  const getTaskStatus = (task) => {
    return task?.status || "open";
  };

  const isTaskOpen = (task) => {
    const status = getTaskStatus(task);

    return (
      status === "open" ||
      status === "pending" ||
      !status
    );
  };

  const stats = useMemo(() => {
    const open = tasks.filter(isTaskOpen).length;

    const assigned = tasks.filter(
      (task) => getTaskStatus(task) === "assigned"
    ).length;

    const completed = tasks.filter(
      (task) => getTaskStatus(task) === "completed"
    ).length;

    return {
      total: tasks.length,
      open,
      assigned,
      completed,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (selectedCategory !== "All") {
      result = result.filter(
        (task) =>
          (task.category || "").toLowerCase() ===
          selectedCategory.toLowerCase()
      );
    }

    if (selectedStatus !== "All") {
      if (selectedStatus === "Open") {
        result = result.filter(isTaskOpen);
      } else if (selectedStatus === "In Progress") {
        result = result.filter(
          (task) => getTaskStatus(task) === "in progress"
        );
      } else {
        result = result.filter(
          (task) =>
            getTaskStatus(task).toLowerCase() ===
            selectedStatus.toLowerCase()
        );
      }
    }

    if (
  selectedDistance !== "All" &&
  userLocation
) {
  const maxDistance = parseInt(
    selectedDistance
  );

  result = result.filter((task) => {
    if (
      !task.location ||
      task.location.latitude == null
    )
      return false;

    const distance =
      calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        task.location.latitude,
        task.location.longitude
      );

    return distance <= maxDistance;
  });
}

    if (searchText.trim()) {
      const search = searchText.trim().toLowerCase();

      result = result.filter((task) => {
        const posterName =
          task?.userName ||
          task?.postedByName ||
          task?.ownerName ||
          task?.userEmail ||
          "";

        return (
          (task.title || "").toLowerCase().includes(search) ||
          (task.description || "").toLowerCase().includes(search) ||
          (task.category || "").toLowerCase().includes(search) ||
          String(task.budget || "").includes(search) ||
          posterName.toLowerCase().includes(search)
        );
      });
    }

    if (selectedSort === "Budget High") {
      result.sort(
        (a, b) => Number(b.budget || 0) - Number(a.budget || 0)
      );
    }

    if (selectedSort === "Budget Low") {
      result.sort(
        (a, b) => Number(a.budget || 0) - Number(b.budget || 0)
      );
    }

    if (selectedSort === "Oldest") {
      result.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime?.() || 0;
        const bTime = b.createdAt?.toDate?.()?.getTime?.() || 0;

        return aTime - bTime;
      });
    }

    if (selectedSort === "Newest") {
      result.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime?.() || 0;
        const bTime = b.createdAt?.toDate?.()?.getTime?.() || 0;

        return bTime - aTime;
      });
    }

    return result;
  }, [
    tasks,
    selectedCategory,
    selectedStatus,
    selectedSort,
    searchText,
  ]);

  const hasActiveFilters =
    searchText.trim() ||
    selectedCategory !== "All" ||
    selectedStatus !== "Open" ||
    selectedSort !== "Newest";

  const handleRefresh = () => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 700);
  };

  const resetFilters = () => {
    setSearchText("");
    setSelectedCategory("All");
    setSelectedStatus("Open");
    setSelectedSort("Newest");
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              alert(error.message);
            }
          },
        },
      ]
    );
  };

  const renderChip = ({
    label,
    active,
    onPress,
  }) => {
    return (
      <TouchableOpacity
        key={label}
        activeOpacity={0.85}
        onPress={onPress}
        style={[
          styles.chip,
          {
            backgroundColor: active ? "#2563EB" : "#FFFFFF",
            borderColor: active ? "#2563EB" : "#E5E7EB",
          },
        ]}
      >
        <Text
          style={[
            styles.chipText,
            {
              color: active ? "#FFFFFF" : "#334155",
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const HeaderComponent = (
    <View>
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeText}>
            Welcome back 👋
          </Text>

          <Text style={styles.brandText}>
            Edulance
          </Text>

          <Text style={styles.taglineText}>
            Student freelancing marketplace
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Ionicons
            name="log-out-outline"
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={["#2563EB", "#1D4ED8", "#1E40AF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>
              STUDENT MARKETPLACE
            </Text>
          </View>

          <Ionicons
            name="sparkles"
            size={24}
            color="#DBEAFE"
          />
        </View>

        <Text style={styles.heroTitle}>
          Discover Tasks,{"\n"}Earn With Skills
        </Text>

        <Text style={styles.heroSubtitle}>
          Apply for tasks, chat with clients, complete work, and build your rating.
        </Text>

        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatBox}>
            <Text style={styles.heroStatValue}>
              {stats.total}
            </Text>

            <Text style={styles.heroStatLabel}>
              Total
            </Text>
          </View>

          <View style={styles.heroStatBox}>
            <Text style={styles.heroStatValue}>
              {stats.open}
            </Text>

            <Text style={styles.heroStatLabel}>
              Open
            </Text>
          </View>

          <View style={[styles.heroStatBox, { marginRight: 0 }]}>
            <Text style={styles.heroStatValue}>
              {stats.completed}
            </Text>

            <Text style={styles.heroStatLabel}>
              Done
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate("Post")}
          style={styles.heroAction}
        >
          <Text style={styles.heroActionText}>
            Post a Task
          </Text>

          <Ionicons
            name="arrow-forward"
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={21}
          color="#64748B"
          style={{ marginRight: 10 }}
        />

        <TextInput
          placeholder="Search tasks, skills, budget, poster..."
          placeholderTextColor="#94A3B8"
          value={searchText}
          onChangeText={setSearchText}
          autoCorrect={false}
          autoCapitalize="none"
          blurOnSubmit={false}
          returnKeyType="search"
          style={styles.searchInput}
        />

        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchText("")}
            style={styles.clearSearchButton}
          >
            <Ionicons
              name="close"
              size={18}
              color="#64748B"
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Category
          </Text>

          <Text style={styles.sectionMiniText}>
            {selectedCategory}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.chipScroll}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {categories.map((category) =>
            renderChip({
              label: category,
              active: selectedCategory === category,
              onPress: () => setSelectedCategory(category),
            })
          )}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Status
          </Text>

          <Text style={styles.sectionMiniText}>
            {selectedStatus}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.chipScroll}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {statusFilters.map((status) =>
            renderChip({
              label: status,
              active: selectedStatus === status,
              onPress: () => setSelectedStatus(status),
            })
          )}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Sort
          </Text>

          <Text style={styles.sectionMiniText}>
            {selectedSort}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.chipScroll}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {sortOptions.map((sort) =>
            renderChip({
              label: sort,
              active: selectedSort === sort,
              onPress: () => setSelectedSort(sort),
            })
          )}
        </ScrollView>
      </View>
<View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>
    Distance
  </Text>

  <Text style={styles.sectionMiniText}>
    {selectedDistance}
  </Text>
</View>

<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
>
  {distanceOptions.map((distance) =>
    renderChip({
      label: distance,
      active:
        selectedDistance === distance,
      onPress: () =>
        setSelectedDistance(distance),
    })
  )}
</ScrollView>
      <View style={styles.latestHeader}>
        <View>
          <Text style={styles.latestTitle}>
            Tasks
          </Text>

          <Text style={styles.latestSubtitle}>
            {filteredTasks.length} result
            {filteredTasks.length === 1 ? "" : "s"} found
          </Text>
        </View>

        {hasActiveFilters ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={resetFilters}
            style={styles.resetButton}
          >
            <Text style={styles.resetButtonText}>
              Reset
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {errorText ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>
            Could not load tasks
          </Text>

          <Text style={styles.errorMessage}>
            {errorText}
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
        edges={["top", "bottom"]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading latest tasks...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        ListHeaderComponent={HeaderComponent}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            navigation={navigation}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2563EB"
            colors={["#2563EB"]}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 150,
        }}
        ListEmptyComponent={
          !errorText ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={34}
                  color="#2563EB"
                />
              </View>

              <Text style={styles.emptyTitle}>
                No tasks found
              </Text>

              <Text style={styles.emptyText}>
                Try changing your search, status, category, or sort filter.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={resetFilters}
                style={styles.emptyButton}
              >
                <Text style={styles.emptyButtonText}>
                  Clear Filters
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 15,
    fontWeight: "600",
  },

  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 18,
    marginBottom: 24,
  },

  welcomeText: {
    color: "#64748B",
    fontSize: 15,
    marginBottom: 5,
    fontWeight: "600",
  },

  brandText: {
    color: "#0F172A",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  taglineText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 4,
    fontWeight: "600",
  },

  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },

  heroCard: {
    borderRadius: 30,
    padding: 22,
    marginBottom: 24,
    shadowColor: "#2563EB",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },

  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  heroBadgeText: {
    color: "#DBEAFE",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 39,
    marginTop: 18,
  },

  heroSubtitle: {
    color: "#DBEAFE",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    fontWeight: "600",
  },

  heroStatsRow: {
    flexDirection: "row",
    marginTop: 20,
  },

  heroStatBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    padding: 14,
    borderRadius: 18,
    marginRight: 10,
  },

  heroStatValue: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
  },

  heroStatLabel: {
    color: "#BFDBFE",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
  },

  heroAction: {
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  heroActionText: {
    color: "#FFFFFF",
    fontWeight: "900",
    marginRight: 8,
  },

  searchContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    minHeight: 56,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    color: "#111827",
    fontSize: 15,
    paddingVertical: 12,
    fontWeight: "600",
  },

  clearSearchButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  filterBlock: {
    marginBottom: 10,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  sectionTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },

  sectionMiniText: {
    color: "#2563EB",
    fontWeight: "800",
    fontSize: 12,
  },

  chipScroll: {
    marginBottom: 20,
  },

  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginRight: 10,
    borderWidth: 1,
  },

  chipText: {
    fontSize: 13,
    fontWeight: "900",
  },

  latestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 4,
  },

  latestTitle: {
    color: "#0F172A",
    fontSize: 25,
    fontWeight: "900",
  },

  latestSubtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  resetButton: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },

  resetButtonText: {
    color: "#0369A1",
    fontWeight: "900",
    fontSize: 13,
  },

  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
  },

  errorTitle: {
    color: "#991B1B",
    fontWeight: "900",
    fontSize: 16,
  },

  errorMessage: {
    color: "#B91C1C",
    marginTop: 5,
    lineHeight: 20,
  },

  emptyBox: {
    marginTop: 30,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
  },

  emptyText: {
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
  },

  emptyButton: {
    marginTop: 18,
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
};