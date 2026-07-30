WHAT CHANGED (per client feedback)
=====================================
1. "The tick has to be longer and not connected to the arrow"
   -> Rebuilt accept_icon.png: the checkmark is now noticeably longer,
      and there's a clear gap between the checkmark's tip and where the
      arrow shaft begins - they no longer touch/overlap.

2. "Can we do a partial circle instead of the box? Circle even if a
   portion of it will look better"
   -> Both badges (reject + accept) now use a circular badge shape
      instead of the rounded rectangle, positioned with a slightly
      negative offset so part of each circle intentionally bleeds past
      the card's edge - giving that "portion of it" look.

WHERE TO PUT THESE
=====================================
home_widget.dart         -> lib/commonWidget/home_widget.dart   (overwrite)
assets/icons/accept_icon.png -> assets/icons/accept_icon.png    (overwrite)

NEXT STEPS
=====================================
1. Copy both files into place.
2. flutter clean && flutter pub get && flutter run
3. Check the Members tab - both badges should now be circular and
   partially overlap the card's corners, and the accept tick should
   read as clearly separate from its arrow.
