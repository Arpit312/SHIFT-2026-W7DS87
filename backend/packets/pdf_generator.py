from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
import io
import os
from django.conf import settings

class HaanPacketGenerator:
    def generate_pdf(self, packet, society, ev_owner, request_obj):
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        
        # Title
        c.setFont("Helvetica-Bold", 24)
        c.drawString(100, 750, "Haan Packet")
        
        # Details
        c.setFont("Helvetica", 12)
        c.drawString(100, 700, f"Society: {society.name if society else 'N/A'}")
        c.drawString(100, 680, f"EV Owner: {ev_owner.full_name if ev_owner else 'N/A'}")
        c.drawString(100, 660, f"Request Number: {request_obj.request_number if request_obj else 'N/A'}")
        
        c.drawString(100, 620, "This packet serves as the official confirmation that the charging")
        c.drawString(100, 600, "installation is approved under the conditions verified.")
        
        c.showPage()
        c.save()
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
