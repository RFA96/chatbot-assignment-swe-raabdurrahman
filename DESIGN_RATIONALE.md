# Design Rationale

This document outlines the key UX decisions, creative features, and architectural choices made in the development of the AI-powered e-commerce chatbot.

---

## UX Decisions

### 1. Floating Chat Widget with Minimal Intrusion

The chatbot is implemented as a **floating bubble** in the bottom-right corner, allowing users to access assistance without leaving their current context. Key design choices:

- **Non-blocking interaction**: Users can browse products while the chat window remains open
- **Minimize capability**: Reduces cognitive load when users need to focus on other tasks
- **Persistent position**: Consistent placement across all pages builds muscle memory
- **Responsive width** (380px): Optimized for readability while preserving screen real estate

### 2. Rich Message Content Types

Rather than text-only responses, the chatbot renders **structured content** that matches user intent:

| Content Type | Purpose | UX Benefit |
|--------------|---------|------------|
| Product Cards | Visual product browsing | Immediate visual recognition, reduces cognitive load |
| Selectable Lists | Multi-item operations | Batch actions save time (e.g., add 5 items at once) |
| Cart Summary | Quick overview | No page navigation needed to check cart |
| Voucher Cards | Promotional display | Visual hierarchy emphasizes savings |
| Quick Replies | Suggested actions | Reduces typing, guides conversation flow |

### 3. Quick Replies for Guided Interaction

**Context-aware suggestion buttons** appear after each AI response:

- **Default suggestions**: "Browse Products", "View Cart", "Current Deals", "Help"
- **Dynamic suggestions**: Change based on response type (e.g., "Checkout Now" after adding to cart)
- **One-click actions**: Eliminates typing for 80% of common operations

This design reduces friction for users who may not know what to ask, while power users can still type custom queries.

### 4. Progressive Authentication

The system supports **optional authentication** with graceful degradation:

- **Guest access**: Search products, get recommendations, ask questions
- **Authenticated features**: Cart, checkout, order history
- **Contextual login prompts**: "Sign in to add items to your cart" appears only when needed

This approach reduces abandonment by not forcing registration upfront while gently encouraging it for committed users.

### 5. Dark/Light Theme Toggle

Implemented with **system preference detection** and manual override:

- Respects user's OS-level preference by default
- Persists choice across sessions
- **Flash prevention**: Inline script loads theme before React hydration to avoid FOUC (Flash of Unstyled Content)

---

## Creative Features

### 1. AI-Powered Tool Calling Architecture

The core innovation is an **intelligent tool-calling loop** where the AI autonomously decides which backend operations to execute:

```
User: "I need a gift for my girlfriend under $50"
     ↓
AI calls: search_products(categories=["Jewelry", "Accessories"], max_price=50)
     ↓
Tool returns: 8 products
     ↓
AI calls: check_stock(product_ids=[...])
     ↓
Tool returns: Stock availability
     ↓
AI synthesizes: Natural language response + product cards
```

**Benefits**:
- Multi-step reasoning without user intervention
- Contextual tool selection based on conversation history
- Maximum 5 iterations prevents infinite loops

### 2. Vague Query Interpretation

The system includes a **gift mapping dictionary** that interprets ambiguous requests:

| User Says | System Interprets |
|-----------|-------------------|
| "gift for girlfriend" | Jewelry, Perfume, Accessories, Clothing, Bags |
| "something nice" | Jewelry, Accessories, Clothing |
| "surprise" | Jewelry, Perfume, Accessories, Electronics |
| "housewarming gift" | Home Decor, Kitchen, Electronics |

This removes the burden of knowing exact category names from users.

### 3. Multi-Select Batch Operations

Product lists include **checkboxes** for bulk operations:

- Select/deselect all with one click
- Visual counter shows "3 items selected"
- **Batch add to cart**: Add multiple products simultaneously
- Cart updates reflect all items immediately

This dramatically improves efficiency for users who want to add several recommended products.

### 4. Smart Message Extraction

The frontend employs **intelligent parsing** of AI responses:

- **Order ID detection**: Regex extraction enables "View Order" button
- **Product ID parsing**: Links mentioned products to detail pages
- **Cart context detection**: Differentiates between search results and current cart display

### 5. Address Label Lookup

Instead of requiring users to recite addresses:

```
User: "Send to my home"
     ↓
AI calls: get_address_by_label(label="Home")
     ↓
Tool returns: Full shipping address
     ↓
AI confirms: "Shipping to 123 Main St..."
```

This creates a natural conversation flow while maintaining data accuracy.

### 6. Product Comparison Tool

Users can request **side-by-side comparisons** of 2-5 products:

- Normalized attribute display
- Price comparison highlighting
- AI-generated recommendation based on user's stated priorities

---

## Technical Architecture Rationale

### Frontend: Next.js 16 + React 19 + Zustand

| Choice | Rationale |
|--------|-----------|
| **Next.js App Router** | Server components for SEO-critical pages (home, products), client components for interactive features (chat) |
| **Zustand** | Lightweight state management with built-in persistence. Separate stores for auth, cart, and chat prevent unnecessary re-renders |
| **TypeScript** | Type safety catches errors at compile time, improves IDE autocomplete, and serves as living documentation |
| **Tailwind CSS** | Utility-first approach enables rapid prototyping and consistent styling with minimal CSS overhead |

### Backend: FastAPI + PostgreSQL + Google Gemini

| Choice | Rationale |
|--------|-----------|
| **FastAPI** | Async support for non-blocking I/O, automatic OpenAPI documentation, Pydantic validation |
| **PostgreSQL** | Robust relational database for e-commerce data integrity (orders, inventory, customers) |
| **Google Gemini** | Function calling capability enables the tool-based architecture; cost-effective for high-volume chat |
| **SQLAlchemy Async** | Non-blocking database operations prevent chat latency during heavy load |

### State Persistence Strategy

Chat messages use a **hybrid persistence model**:

1. **LocalStorage (Zustand)**: Last 50 messages for instant load
2. **PostgreSQL**: Full conversation history for analytics and recovery
3. **Session switching**: Users can resume previous conversations

This balances performance (instant UI on page load) with durability (no data loss).

---

## Accessibility Considerations

- **Keyboard navigation**: Chat input, send button, and quick replies are keyboard-accessible
- **Focus management**: Focus returns to input after sending message
- **ARIA labels**: Interactive elements include descriptive labels
- **Color contrast**: Dark/light themes tested for WCAG AA compliance
- **Loading states**: Typing indicator and skeleton loaders provide feedback for screen reader users

---

## Future Enhancement Opportunities

1. **Voice input**: Web Speech API for hands-free interaction
2. **Image upload**: Visual search for "find products like this"
3. **Multi-language support**: i18n for Indonesian market
4. **Personalized recommendations**: ML-based suggestions from purchase history
5. **Real-time notifications**: WebSocket for order status updates

---

*Document Version: 1.0 | Last Updated: February 2026*
