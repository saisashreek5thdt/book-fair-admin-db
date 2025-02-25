const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// **Create Event Schedule and Maintain Sequential IDs**
router.post("/", async (req, res) => {
    const { day, date, eventName, eventDescription, speakerIds, isActive } = req.body;
  
    try {
      // Fetch the highest current ID to maintain sequential numbering
      const nextId = await getNextEventId();
  
      const eventSchedule = await prisma.event.create({
        data: {
          id: nextId,
          day,
          date: new Date(date),
          eventName,
          eventDescription,
          isActive: isActive === "true" || isActive === true,
          speakers: {
            connect: speakerIds.map(id => ({ id: parseInt(id) })),
          },
        },
      });
  
      res.status(201).json(eventSchedule);
    } catch (error) {
      console.error("Error creating event schedule:", error);
      res.status(500).json({ error: "Failed to create event schedule" });
    }
  });

// **Get Event Schedule with Speaker Details**
router.get("/", async (req, res) => {
  try {
    const events = await prisma.event.findMany({
        where: {
            isActive: true, // Fetch only active events
          },
      include: {
        speakers: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });

    res.json(events);
  } catch (error) {
    console.error("Error fetching event schedules:", error);
    res.status(500).json({ error: "Failed to fetch event schedules" });
  }
});

// **Update Event Schedule (Partial Update)**
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { day, date, eventName, eventDescription, speakerIds, isActive } = req.body;
  
    try {
      const updateData = {};
  
      // Update only fields that are provided
      if (day) updateData.day = day;
      if (date) updateData.date = new Date(date);
      if (eventName) updateData.eventName = eventName;
      if (eventDescription) updateData.eventDescription = eventDescription;
      if (typeof isActive !== "undefined") updateData.isActive = isActive === "true" || isActive === true;
      
      // Update speaker relationships only if provided
      if (Array.isArray(speakerIds)) {
        updateData.speakers = {
          set: speakerIds.map(id => ({ id: parseInt(id) })), // Reset speakers with new assignments
        };
      }
  
      const eventSchedule = await prisma.event.update({
        where: { id: parseInt(id) },
        data: updateData,
      });
  
      res.json(eventSchedule);
    } catch (error) {
      console.error("Error updating event schedule:", error);
      res.status(500).json({ error: "Failed to update event schedule" });
    }
  });

// **Delete Event Schedule and Maintain Sequential IDs**
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
  
    try {
      await prisma.event.delete({ where: { id: parseInt(id) } });
  
      // Reset IDs sequentially after deletion
      const remainingEvents = await prisma.event.findMany({ orderBy: { id: "asc" } });
  
      for (let index = 0; index < remainingEvents.length; index++) {
        await prisma.event.update({
          where: { id: remainingEvents[index].id },
          data: { id: index + 1 },
        });
      }
  
      res.json({ message: "Event schedule deleted and IDs reset successfully" });
    } catch (error) {
      console.error("Error deleting event schedule:", error);
      res.status(500).json({ error: "Failed to delete event schedule" });
    }
  });
  
  // **Get Next Event ID Helper**
  async function getNextEventId() {
    const lastEvent = await prisma.event.findFirst({
      orderBy: { id: "desc" },
      select: { id: true },
    });
    return lastEvent ? lastEvent.id + 1 : 1; // Start from 1 if no events exist
  }

module.exports = router;
