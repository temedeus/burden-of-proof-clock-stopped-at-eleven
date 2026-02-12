# clock-stopped-at-eleven

## Debug Mode

To enable debug visualization for collision and interaction areas, add `?debug=true` to the URL when running the game.

### How to Use Debug Mode

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open the game with debug flag:**
   - Navigate to: `http://localhost:5173/?debug=true`
   - Or: `http://localhost:5173/index.html?debug=true`

3. **Debug overlays will show:**
   - **Red outline + grid**: Player collision box and occupied tiles
   - **Blue outline + grid**: NPC collision boxes and occupied tiles  
   - **Green outline + grid**: Furniture collision areas and occupied tiles
   - **Yellow highlight**: Interaction target tile (where you're facing)
   - **Orange dot**: Player's interaction point (center)
   - **Orange dashed line**: Interaction reach line from interaction point to target tile

### Debug Mode Features

- Visualize collision boundaries for all entities
- See which tiles are occupied by player, NPCs, and furniture
- Check if interaction target tile overlaps with interactable objects
- Diagnose collision/interaction issues

### Disable Debug Mode

Simply reload the page without the `?debug=true` parameter, or use `?debug=false`.
