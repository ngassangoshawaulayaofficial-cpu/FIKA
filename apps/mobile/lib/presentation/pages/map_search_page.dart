import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../core/theme/colors.dart';
import 'provider_details_page.dart';

class MapSearchPage extends StatefulWidget {
  final List<Map<String, dynamic>> providers;

  const MapSearchPage({super.key, required this.providers});

  @override
  State<MapSearchPage> createState() => _MapSearchPageState();
}

class _MapSearchPageState extends State<MapSearchPage> {
  // Center map on Dar es Salaam
  static const LatLng _darEsSalaam = LatLng(-6.7924, 39.2083);
  late GoogleMapController _mapController;
  final Set<Marker> _markers = {};

  @override
  void initState() {
    super.initState();
    _createMarkers();
  }

  void _createMarkers() {
    for (final p in widget.providers) {
      final markerId = MarkerId(p['id']);
      final lat = p['latitude'] as double? ?? -6.7924;
      final lng = p['longitude'] as double? ?? 39.2083;

      _markers.add(
        Marker(
          markerId: markerId,
          position: LatLng(lat, lng),
          infoWindow: InfoWindow(
            title: p['name'],
            snippet: '⭐ ${p['rating']} - ${p['bio']}',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ProviderDetailsPage(
                    providerName: p['name'],
                    rating: p['rating'],
                    bio: p['bio'],
                  ),
                ),
              );
            },
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Map Discovery'),
        backgroundColor: FikaColors.primaryRoyalBlue,
        foregroundColor: Colors.white,
      ),
      body: GoogleMap(
        initialCameraPosition: const CameraPosition(
          target: _darEsSalaam,
          zoom: 13,
        ),
        onMapCreated: (controller) => _mapController = controller,
        markers: _markers,
        myLocationEnabled: true,
        zoomControlsEnabled: true,
      ),
    );
  }
}
